import { createBot, Bot } from "mineflayer";
import { Client, ServerClient, states } from "minecraft-protocol";
import { EventEmitter } from "events";
import loadPlugins from "./loadPlugins";
import Command from "./Command";
import Module from "./Module";
import getOptions, { Options } from "./Options";
import { getPlugins, TextComponent, VERSION } from "../KiberKotleta";
import PacketEvent from "./KiberKotletaPacketEvent";
import MinecraftData from "minecraft-data";
import { default as ChatMessage } from 'prismarine-chat';
const registry = require('prismarine-registry')('1.19');

const detachedPlayers = {};

export function getDetachedPlayer(name: string): Player | never {
    if (!detachedPlayers[name]) return null;
    return detachedPlayers[name];
}

const players = {};

export function getPlayer(name: string): Player | never {
    if (!players[name]) return null;
    return players[name];
}

function sleep(ms) {
    return new Promise(x => {
        setTimeout(() => {
            x(true);
        }, ms);
    });
}

export class PlayerPosition {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
}

export class Player extends EventEmitter {

    targetClient: Bot;
    sourceClient: ServerClient;

    host: string;
    port: number;
    position: PlayerPosition;

    manualMovement: boolean;

    mcData: MinecraftData.IndexedData;

    commands: Command[];
    modules: Module[];
    plugins: any[];

    detached: boolean = false;
    detachedSince: number;
    packetBuffer: PacketEvent[] = [];

    async detach() {
        this.detached = true;
        detachedPlayers[this.username] = this;
        this.sourceClient.end("Detached");
        this.detachedSince = Date.now();
    }

    async attach(client: ServerClient) {
        this.sourceClient = client;
        //client.write('login', this.loginPacket);
        this.manualMovement = false;
        for (const packet of this.packetBuffer) {
            if (packet.name != 'map_chunk') await sleep(100); // Я не знаю, но без sleep это не работает. wtf
            client.write(packet.name, packet.data);
        }
        await sleep(100);
        client.write('position', {
            x: this.targetClient.entity.position.x,
            y: this.targetClient.entity.position.y,
            z: this.targetClient.entity.position.z,
            yaw: 0,
            pitch: 0,
            flags: 0x00
        });
        await sleep(1000);
        this.manualMovement = true;

        this.detached = false;
        this.sendMessage(this.translate('attached', new Date(Date.now() - this.detachedSince).toLocaleTimeString()))
        this.packetBuffer = this.packetBuffer.filter(x => x.name != 'system_chat' && x.name != 'chat_message');
        delete detachedPlayers[this.username];
        client.on('packet', async (data, { name, state }) => {
            const player = this;
            const target = player.targetClient;
            try {
                if (player.detached) return;
                var packetEvent = new PacketEvent(name, state, data, 'client');
                player.emit('packet', packetEvent);
                for (const module of player.modules.filter(x => x.state)) {
                    module.emit('packet', packetEvent);
                }
                if (packetEvent.cancel) return;
                if (name == 'chat_message') {
                    if (!(await player.onChatMessage(data.message))) return;
                }
                if (['position', 'position_look', 'look'].includes(name)) {
                    if (!player.manualMovement) return;
                    player.position = Object.assign(player.position, data);
                    player.targetClient.entity.position.x = player.position.x;
                    player.targetClient.entity.position.y = player.position.y;
                    player.targetClient.entity.position.z = player.position.z;
                }
                if (name == 'kick_disconnect') {
                    player.sendMessage(player.translate('generic_kicked'));
                    player.sendMessage(JSON.parse(data.reason));
                    return;
                }
                if (target._client.state == states.PLAY && state == states.PLAY && name != "keep_alive")
                    target._client.write(packetEvent.name, packetEvent.data);
            } catch (error) {
                console.error(error);
                player.sendMessage({
                    text: player.translate('generic_error', error.stack)
                })
            }
        });
    }

    options: Options;
    yaw: number;
    pitch: number;

    loginPacket: any;
    isLinkedToMatrix: boolean = false;

    get username(): string {
        return this.sourceClient.username;
    }

    get version(): string {
        return this.sourceClient.version;
    }

    minecraftLocale: string;

    teleport(x: number, y: number, z: number, yaw?: number, pitch?: number, flags?: number) {
        if (!yaw) yaw = 0;
        if (!pitch) pitch = 0;
        if (!flags) flags = 0x00;
        const d = {
            x,
            y,
            z,
            yaw,
            pitch,
            flags
        };
        if (this.detached) {
            return this.packetBuffer.push(new PacketEvent('position', states.PLAY, d, 'server'));
        }
        this.sourceClient.write('position', d);
    }

    sendMessage(message: string | TextComponent | TextComponent[], prefix?: string) {

        if (typeof prefix !== "string") prefix = this.options.messagePrefix;
        if (typeof message === "string") message = {
            text: message
        };

        const data = {
            content: JSON.stringify({ text: prefix, extra: [message] }),
            type: 1
        };

        if (this.detached) {
            this.packetBuffer.push(new PacketEvent('system_chat', null, data, 'server'));
            return;
        } else {
            this.sourceClient.write('system_chat', data);
        }

        this.emit('packet', new PacketEvent('system_chat', states.PLAY, data, 'kiberkotleta'));

    }

    loadPlugin(plugin: Function) {
        plugin.bind(this)(this);
        this.plugins.push(plugin);
    }

    constructor(sourceClient: ServerClient, targetClient: Bot) {
        super();
        this.sourceClient = sourceClient;
        this.targetClient = targetClient;

        this.position = new PlayerPosition();
        this.manualMovement = true;
        this.plugins = [];

        this.options = getOptions(this.sourceClient.username);

        this.commands = [];
        this.modules = [];
    }

    async onChatMessage(message: string) {
        if (message.startsWith(this.options.commandPrefix)) {
            var args = message.split(' ');
            var cmd = args.shift()?.slice(this.options.commandPrefix.length);
            var command = this.commands.find(command => command.name.toLowerCase() == cmd?.toLowerCase());
            if (!command) {
                this.sendMessage(this.translate('err_no_such_command'));
                return false;
            }
            if (args.length < command.minArgsCount) {
                this.sendMessage(this.translate("err_usage", command.name + command.usage));
                return false;
            }
            try {
                if (command.execute.toString().startsWith('async (')) {
                    await command.execute(this, args);
                } else {
                    command.execute(this, args);
                }
            } catch (error) {
                console.error(error);
                this.sendMessage({
                    text: this.translate('err_command')
                });
            }
            return false;
        }
        return true;
    }

    locale() {
        try {
            return require(`../locale/${this.options.locale}.json`);
        } catch (error) {
            return require(`../../locale/${this.options.locale}.json`);
        }
    }

    translate(key, ...args) {
        var v = this.locale()[key] ?? key;
        for (const i in args) {
            v = v.replaceAll(`{${i}}`, args[i]);
        }
        return v;
    }

}

export default function inject(client: ServerClient, host: string, port: number) {

    if (detachedPlayers[client.username]) {
        const p: Player = detachedPlayers[client.username];
        p.attach(client);
        return;
    }

    const target: Bot = createBot({
        username: client.username,
        host,
        port,
        brand: "KiberKotleta " + VERSION,
        loadInternalPlugins: false
    });

    console.log(`${client.username} joined`);

    const player = new Player(client, target);

    players[client.username] = player;

    player.mcData = MinecraftData(client.version);

    player.host = host;
    player.port = port;

    loadPlugins(player, client, target);

    for (const m of player.options.enabledModules) {
        const mod = player.modules.find(x => x.name == m);
        if (mod) {
            mod.enable();
        }
    }

    getPlugins().forEach(x => {
        if (typeof x.onPlayer === "function") {
            x.onPlayer(player);
        }
    });

    target.on('move', (pos) => {
        player.teleport(pos.x, pos.y, pos.z);
    });

    target.once('spawn', () => {
        player.emit('joined');
        setTimeout(() => {
            //player.sendMessage([{ text: `\n` }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#0094ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5050ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#0094ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5050ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#0093ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5051ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#1a7dff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5051ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#3567ff" }, { "text": "█", "color": "#4f51ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ce00f2" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#4e52ff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#8425ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#c900f4" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#693cff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#c400f6" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#8326ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#be00f9" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#9d10ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#b900fb" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#b400fd" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#d800ed" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#c100f8" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#f600df" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#cd00f2" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ff00dc" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#da00ec" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ff00dc" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#e600e6" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ff00dc" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { text: `\nKiberKotleta ${VERSION}` }], "");
            setTimeout(() => {
                player.sendMessage(player.translate('locale_warning'));
            }, 1000);
        }, 5000);
    });

    client.on('error', (err) => {
        console.error(err);
        player.sendMessage(player.translate('generic_connection_lost'));
    });

    client.on('end', () => {

    });

    client.on('packet', async (data, { name, state }) => {
        try {
            if (player.detached) return;
            if (name == 'settings') {
                player.minecraftLocale = data.locale;
                player.emit('minecraft_locale_changed', data.locale);
            }
            var packetEvent = new PacketEvent(name, state, data, 'client');
            player.emit('packet', packetEvent);
            for (const module of player.modules.filter(x => x.state)) {
                module.emit('packet', packetEvent);
            }
            if (packetEvent.cancel) return;
            if (name == 'chat_message') {
                if (!(await player.onChatMessage(data.message))) return;
            }
            if (['position', 'position_rotate', 'rotate', 'position_look', 'look'].includes(name)) {
                if (!player.manualMovement) return;
                player.position = Object.assign(player.position, data);
                player.targetClient.entity.position.x = player.position.x;
                player.targetClient.entity.position.y = player.position.y;
                player.targetClient.entity.position.z = player.position.z;
                player.yaw = data.yaw;
                player.pitch = data.pitch;
                console.log(`${name} - ${JSON.stringify(data)}`);
            }
            if (target._client.state == states.PLAY && state == states.PLAY && name != "keep_alive")
                target._client.write(packetEvent.name, packetEvent.data);
        } catch (error) {
            console.error(error);
            player.sendMessage({
                text: player.translate('generic_error', error.stack)
            })
        }
    });

    target._client.on('packet', (data, { name, state }) => {
        if ([
            'login', 'difficulty', 'abilities', 'held_item_slot', 'declare_recipes',
            'tags', 'entity_status', 'unlock_recipes', 'teams', 'position', 'player_info',
            'update_view_distance', 'simulation_distance', 'spawn_entity', 'spawn_position',
            'window_items', 'experience', 'declare_commands', 'map_chunk', 'destroy_entity' //, 'custom_payload'
        ].includes(name)) {
            if (name != 'map_chunk' && name != 'spawn_entity' && name != 'destroy_entity' && name != 'tags'
                && name != 'teams' && name != 'entity_status') {
                player.packetBuffer = player.packetBuffer.filter(x => x.name != name);
            }
            player.packetBuffer.push(new PacketEvent(name, state, data, 'server'));
        }
        try {
            var packetEvent = new PacketEvent(name, state, data, 'server');
            player.emit('packet', packetEvent);
            for (const module of player.modules.filter(x => x.state)) {
                module.emit('packet', packetEvent);
            }
            if (packetEvent.cancel) return;
            if (name == 'set_compression') {
                player.sourceClient.compressionThreshold = data.threshold;
            }
            if (name == 'kick_disconnect') {
                player.sendMessage(player.translate('generic_kicked'));
                player.sendMessage(JSON.parse(data.reason));
                return;
            }
            if (player.sourceClient.state == states.PLAY && state == states.PLAY && name != "keep_alive")
                player.sourceClient.write(packetEvent.name, packetEvent.data);
            //if ((name == 'chat_message' || name == 'system_chat') && player.detached && !player.isLinkedToMatrix) {
            //    player.packetBuffer.push(new PacketEvent(name, state, data, 'server'));
            //}
        } catch (error) {
            console.error(error);
            player.sendMessage({
                text: player.translate('generic_error', error.stack)
            })
        }
    });
}