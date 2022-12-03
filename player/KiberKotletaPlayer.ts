import { createBot, Bot } from "mineflayer";
import { ServerClient, states } from "minecraft-protocol";
import { EventEmitter } from "events";
import loadPlugins from "./loadPlugins";
import Command from "./Command";
import Module from "./Module";
import getOptions, { Options } from "./Options";
import { getPlugins, TextComponent, VERSION } from "../KiberKotleta";
import PacketEvent from "./KiberKotletaPacketEvent";

export class Player extends EventEmitter {

    targetClient: Bot;
    sourceClient: ServerClient;

    host: string;
    port: number;

    commands: Command[];
    modules: Module[];

    options: Options;

    get username(): string {
        return this.sourceClient.username;
    }

    teleport(x: number, y: number, z: number, yaw?: number, pitch?: number, flags?: number) {
        if (!yaw) yaw = 0;
        if (!pitch) pitch = 0;
        if (!flags) flags = 0x00;
        this.sourceClient.write('position', {
            x,
            y,
            z,
            yaw,
            pitch,
            flags
        });
    }

    sendMessage(message: string | TextComponent | TextComponent[], prefix?: string) {
        if (typeof prefix !== "string") prefix = this.options.messagePrefix;
        this.sourceClient.write('system_chat', {
            content: JSON.stringify({ text: prefix, extra: [message] }),
            position: 1,
            sender: '0'
        });
    }

    loadPlugin(plugin: Function) {
        plugin.bind(this)(this);
    }

    constructor(sourceClient: ServerClient, targetClient: Bot) {
        super();
        this.sourceClient = sourceClient;
        this.targetClient = targetClient;

        this.options = getOptions(this.sourceClient.username);

        this.commands = [];
        this.modules = [];
    }

    onChatMessage(message: string) {
        if (message.startsWith(this.options.commandPrefix)) {
            var args = message.split(' ');
            var cmd = args.shift()?.slice(this.options.commandPrefix.length);
            var command = this.commands.find(command => command.name.toLowerCase() == cmd?.toLowerCase());
            if (!command) {
                this.sendMessage("§cНеизвестная команда.");
                return false;
            }
            if (args.length < command.minArgsCount) {
                this.sendMessage("§cНедостаточно параметров.");
                return false;
            }
            command.execute(this, args);
            return false;
        }
        return true;
    }

}

export default function inject(client: ServerClient, host: string, port: number) {

    const target: Bot = createBot({
        username: client.username,
        host,
        port,
        brand: "KiberKotleta " + VERSION,
        loadInternalPlugins: false
    });

    console.log(`${client.username} подключился`);

    const player = new Player(client, target);

    player.host = host;
    player.port = port;

    loadPlugins(player, client, target);

    getPlugins().forEach(x => {
        if (typeof x.onPlayer === "function") {
            x.onPlayer(player);
        }
    });

    target.once('spawn', () => {
        player.emit('joined');
        setTimeout(() => {
            player.sendMessage([{ text: `\n` }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#0094ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5050ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#0094ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5050ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#0093ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5051ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#1a7dff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#5051ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#3567ff" }, { "text": "█", "color": "#4f51ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ce00f2" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#4e52ff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#8425ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#c900f4" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#693cff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#c400f6" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#8326ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#be00f9" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#9d10ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#b900fb" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#b200ff" }, { "text": "█", "color": "#b400fd" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#d800ed" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#c100f8" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#f600df" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#cd00f2" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ff00dc" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#da00ec" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ff00dc" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#e600e6" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#404040" }, { "text": "█", "color": "#ff00dc" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "\n█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { "text": "█", "color": "#000000" }, { text: `\nKiberKotleta ${VERSION}` }], "");
        }, 5000);
    });

    client.on('packet', (data, { name, state }) => {
        var packetEvent = new PacketEvent(name, state, data, 'client');
        player.emit('packet', packetEvent);
        for (const module of player.modules.filter(x => x.state)) {
            module.emit('packet', packetEvent);
        }
        if (packetEvent.cancel) return;
        if (name == 'chat_message') {
            if (!player.onChatMessage(data.message)) return;
        }
        if (name == 'kick_disconnect') {
            player.sendMessage(`Вас выгнали с сервера.`);
            player.sendMessage(JSON.parse(data.reason));
            return;
        }
        if (target._client.state == states.PLAY && state == states.PLAY && name != "keep_alive")
            target._client.write(name, data);
    });

    target._client.on('packet', (data, { name, state }) => {
        var packetEvent = new PacketEvent(name, state, data, 'server');
        player.emit('packet', packetEvent);
        if (packetEvent.cancel) return;
        if (client.state == states.PLAY && state == states.PLAY && name != "keep_alive")
            client.write(name, data);
    });

}