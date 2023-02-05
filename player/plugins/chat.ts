import { Module, VERSION } from "../../KiberKotleta";
import Command from "../Command";
import PacketEvent from "../KiberKotletaPacketEvent";
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
            from: 'es',
            to: 'ru',
            from2: 'ru',
            to2: 'es',
            lingva_host: 'https://translate.jae.fi'
        });
    }
    var translatorSettings = player.options.getModuleOptions("Translate");

    translateChatModule.on('packet', (packet: PacketEvent) => {
        if (packet.name == 'chat_message') {
            console.log(JSON.stringify(packet));
        }
        if (packet.source == 'server' &&
            ['chat_message', 'system_chat'].includes(packet.name) &&
            [1, 0, 7].includes(packet.data.type)) {
            var tc = JSON.parse(packet.data.content);
            console.log(`Original: ${JSON.stringify(packet)}`);
            packet.cancel = true;
            translateTextComponent(tc, translatorSettings.from, translatorSettings.to, Object.keys(player.targetClient.players), translatorSettings.lingva_host).then(data => {
                console.log(`Translated: ${JSON.stringify(data)}`);
                player.sourceClient.write('system_chat', {
                    sender: packet.data.sender ?? '0',
                    type: packet.data.type ?? 1,
                    content: JSON.stringify(data)
                });
            });
        }
    });

    var a = "";

    player.commands.push(
        new Command(
            "tr",
            player.translate('cmd_tr_desc'),
            player.translate('cmd_tr_usage'),
            0,
            async (p, args: string[]) => {
                if (args.length > 0) {
                    var text = args.join(' ');
                    a = (await translateTextComponent({ text }, translatorSettings.from2, translatorSettings.to2, Object.keys(player.targetClient.players), translatorSettings.lingva_host)).text;
                    player.sendMessage(player.translate('cmd_tr_result', a));
                } else {
                    if (a == '') return;
                    player.targetClient.chat(a);
                    a = "";
                }
            }
        )
    );

    player.modules.push(TimestampsModule);
    player.modules.push(translateChatModule);

}