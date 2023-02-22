import { Module, VERSION } from "../../KiberKotleta";
import Command from "../Command";
import PacketEvent from "../KiberKotletaPacketEvent";
import uuid from 'uuid';
import { Player } from "../KiberKotletaPlayer";
import moment from "moment";
import { translateTextComponent } from "../../util/textComponent";

export default function chatPlugin(player: Player) {

    var TimestampsModule = new Module("Timestamps", player.translate('module_Timestamps'), player);

    TimestampsModule.on('packet', (packet: PacketEvent) => {
        if (packet.source == 'server' &&
            ['chat_message', 'system_chat'].includes(packet.name) &&
            [1, 0, 7, 3, 4, 5].includes(packet.data.type)) {
            packet.data.content = JSON.stringify({
                "text": `§7[${moment().format("HH:mm:ss")}]§r `,
                "extra": [
                    JSON.parse(packet.data.content)
                ]
            });
        }
    });

    var translateChatModule = new Module("Translate", player.translate('module_Translate'), player);
    if (!player.options.hasModule('Translate')) {
        player.options.setModuleOptions('Translate', {
            from: 'auto',
            to: 'en',
            from2: 'en',
            to2: 'es',
            autodetect: true,
            lingva_host: 'https://translate.jae.fi'
        });
    }

    var translatorSettings = player.options.getModuleOptions("Translate");
    var translateOutcomingMessages = true;

    translateChatModule.on('enabled', async () => {
        if (translatorSettings.autodetect) {
            const l = player.minecraftLocale.split('_')[0];
            translatorSettings.to = l;
            translatorSettings.from2 = l;
            player.options.setModuleOptions('Translate', translatorSettings);
            translateChatModule.sendMessage(player.translate('module_Translate_autodetected', l, '.conf Translate autodetect false'));
        }
    });

    translateChatModule.on('packet', (packet: PacketEvent) => {
        if (packet.name == 'chat_message' && packet.source == 'client') {
            if (translateOutcomingMessages && !packet.data.message.startsWith('/') && !packet.data.message.startsWith(player.options.commandPrefix)) {
                translateTextComponent({text: packet.data.message}, translatorSettings.from2, translatorSettings.to2, Object.keys(player.targetClient.players), translatorSettings.lingva_host).then(data => {
                    player.targetClient.chat(data.text);
                });
                packet.cancel = true;
            }
        }
        if (packet.source == 'server' &&
            ['chat_message', 'system_chat'].includes(packet.name) &&
            [1, 0, 7].includes(packet.data.type)) {
            var tc = JSON.parse(packet.data.content);
            console.log(`Original: ${JSON.stringify(packet)}`);
            packet.cancel = true;
            translateTextComponent(tc, translatorSettings.from, translatorSettings.to, Object.keys(player.targetClient.players), translatorSettings.lingva_host).then(data => {
                player.sourceClient.write('system_chat', {
                    sender: packet.data.sender ?? '0',
                    type: packet.data.type ?? 1,
                    content: JSON.stringify(data)
                });
            });
        }
    });

    player.commands.push(
        new Command(
            "tr",
            player.translate('cmd_tr_desc'),
            '',
            0,
            async (p, args: string[]) => {
                translateOutcomingMessages = !translateOutcomingMessages;
                if (translateOutcomingMessages) {
                    player.sendMessage(player.translate('cmd_tr_enabled'));
                } else {
                    player.sendMessage(player.translate('cmd_tr_disabled'));
                }
            }
        )
    );

    player.modules.push(translateChatModule);
    player.modules.push(TimestampsModule);

    var i: NodeJS.Timer;
    var spammed: number = 0;
    player.commands.push(new Command(
        "spam",
        player.translate('cmd_spam_desc'),
        player.translate('cmd_spam_usage'),
        3,
        (player: Player, args: string[]) => {
            spammed = 0;
            var count = parseInt(args[0]);
            var interval = parseFloat(args[1]);
            var message = args.slice(2).join(' ');
            i = setInterval(() => {
                spammed++;
                if (spammed >= count) {
                    return clearInterval(i);
                }
                player.targetClient.chat(message.replace(/%random%/g, uuid.v4().replace(/\-/g, '')));
            }, interval * 1e3);
        }
    ));
    player.commands.push(new Command(
        "cancelspam",
        player.translate('cmd_cancelspam_desc'),
        "",
        0,
        (player: Player, args: string[]) => {
            if (i) {
                clearInterval(i);
            }
        }
    ));

}