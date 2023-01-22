import { Module, VERSION } from "../../KiberKotleta";
import Command from "../Command";
import PacketEvent from "../KiberKotletaPacketEvent";
import { Player } from "../KiberKotletaPlayer";
import moment from "moment";

function editTextComponent(c, source, target) {
    if (c.text) c.text = c.text.replace(source, target);
    let extra = [];
    if (c.extra) {
        for (let i = 0; i < c.extra.length; i++) {
            let extraValue = c.extra[i];
            extra.push(editTextComponent(extraValue, source, target));
        }
        c.extra = extra;
    }
    return c;
}

const cache = {};
async function translateTextComponent(c, source, target, playerList) {
    if (!c.text && c.extra) {
        let ext = [];
        for (const extra of c.extra) {
            ext.push(await translateTextComponent(extra, source, target, playerList));
        }
        return { text: '', extra: ext };
    }
    if (!c.text && !c.extra) {
        return { text: '' };
    }
    if (c.text.replaceAll(" ", "").length < 1) return c;
    if (playerList.includes(c.text)) return c;
    //if (/^\/[0-9\|\\\/\-\=\+\[\]\{\}\"\'\;\:\,\.]+$/.test(c.text)) return c;
    const fetch = require('node-fetch');
    const data = JSON.stringify({
        q: c.text,
        source,
        target
    });
    try {
        try {
            if (cache[c.text]) {
                c.text = cache[c.text];
            } else {
                let resp = await fetch("https://translate.argosopentech.com/translate", {
                    method: "POST",
                    body: data,
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                let ctn = await resp.json();
                cache[c.text] = ctn.translatedText;
                c.text = ctn.translatedText;
            }
        } catch (err) {
            console.error(err);
        }
        let extra = [];
        if (c.extra) {
            if (c.extra.length == 0) delete c.extra;
            else {
                for (let i = 0; i < c.extra.length; i++) {
                    let extraValue = c.extra[i];
                    extra.push(await translateTextComponent(extraValue, source, target, playerList));
                }
                c.extra = extra;
            }
        } //else delete c.extra;
        var d = {};
        d['text'] = c.text ?? "";
        if (c.selector) d['selector'] = c.selector;
        if (c.color) d['color'] = c.color;
        if (c.extra) d['extra'] = c.extra;
        return d;
    } catch (err) {
        console.error(err);
    }
    return { text: "Translation Error" };
}

export default function chatPlugin(player: Player) {

    var timeChatModule = new Module("TimeChat", "Время около сообщений в чате", player);

    timeChatModule.on('packet', (packet: PacketEvent) => {
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

    var translateChatModule = new Module("Translate", "Перевод сообщений в чате", player);
    var translatorSettings = player.options.getModuleOptions("Translate") ?? {
        from: 'auto',
        to: 'ru'
    };

    translateChatModule.on('packet', (packet: PacketEvent) => {

        if (packet.source == 'server' &&
            ['chat_message', 'system_chat'].includes(packet.name) &&
            [1, 0, 7].includes(packet.data.type)) {
            var tc = JSON.parse(packet.data.content);
            console.log(`Original: ${packet.data.content}`);
            translateTextComponent(tc, translatorSettings.from, translatorSettings.to, Object.keys(player.targetClient.players)).then((data) => {
                if (!data) return;
                if (data.extra && data.extra.length == 0) delete data.extra;
                packet.data.content = JSON.stringify(data);
                console.log(`Translated: ${packet.data.content}`);
                player.sourceClient.write(packet.name, packet.data);
            }).catch(err => {
                console.error(err);
            });
            packet.cancel = true;
        }
    });

    player.modules.push(timeChatModule);
    player.modules.push(translateChatModule);

}