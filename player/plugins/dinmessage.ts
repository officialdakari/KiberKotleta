import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import { Player } from "../KiberKotletaPlayer";
import { existsSync, writeFileSync } from "fs";
import { default as fetch } from "node-fetch";

export const PREFIX = "\u00A78[\u00A7DinMessage\u00A78] \u00A7f";

// six high loads
export default async function dinMessagePlugin(player: Player) {
    if (!existsSync('./cache/dinmsg.js')) {
        const fetched = await fetch("http://msg.darkcoder15.tk/v2/src/dinmsg.js");
        if (fetched.ok) {
            writeFileSync('./cache/dinmsg.js', await fetched.text());
        } else {
            player.sendMessage(PREFIX + "\u00A7cНе удалось скачать Framework для API DinMessage.");
            return;
        }
    }
    const DinMessage = require('../../cache/dinmsg');
    var client;

    async function connectClient() {
        var opt = player.options.getModuleOptions("DinMessage");
        if (client) return "already_connected";
        
        client = new DinMessage.Client({});
        await client.login(opt.token);
        client.connectWS();
        await client.updateWhoAmI();
        player.sendMessage(PREFIX + "\u00A7aВход выполнен как " + client.username);
    }
    
    player.commands.push(new Command(
        "config-dm",
        "Конфигурация клиента DinMessage",
        "config-dm <autoconnect|token> <значение>",
        2,
        async ({}, args: string[]) => {
            var opt = player.options.getModuleOptions("DinMessage");
            if (args[0] == 'autoconnect') {
                if (args[1] == 'yes') {
                    opt.autoconnect = true;
                    player.sendMessage(PREFIX + "\u00A7aАвто-подключение включено.");
                } else if (args[1] == 'no') {
                    opt.autoconnect = false;
                    player.sendMessage(PREFIX + "\u00A7aАвто-подключение выключено.");
                } else {
                    player.sendMessage(PREFIX + "\u00A7cПараметр принимает значения yes и no, но не \u00A74" + args[1] + "\u00A7c.");
                }
            } else if (args[0] == 'token') {
                opt.token = args[1];
                player.sendMessage(PREFIX + "\u00A7aТокен изменён.");
            }
        }
    ));
}