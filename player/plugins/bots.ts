import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import * as mineflayer from 'mineflayer';
import { Player } from "../KiberKotletaPlayer";

var bots: mineflayer.Bot[] = [];

export function getBots() {
    return bots;
}

export const PREFIX: string = "\u00A78[\u00A77Bots\u00A77] ";

export default function botsPlugin(player: Player) {
    player.commands.push(new Command(
        "connect_bot", 
        "Добавить бота на сервер",
        "connect_bot <никнейм>",
        1,
        (args: string[]) => {
            var nickname: string = args[0];
            if (!/^[a-zA-Z0-9_]+$/.test(nickname)) return player.sendMessage({ text: PREFIX + 'Этот никнейм не подходит.' });
            var bot: mineflayer.Bot = mineflayer.createBot({
                username: nickname,
                brand: `KiberKotleta Bot`,
                host: player.host,
                port: player.port,
                physicsEnabled: true,
                viewDistance: 'tiny'
            });
            bots.push(bot);
            bot.on('end', () => {
                bots = bots.filter(x => x != bot);
            });
        }
    ));
    
    player.commands.push(new Command(
        "chat_bot", 
        "Написать в чат от имени ботов",
        "chat_bot <никнеймы|*> <сообщение...>",
        2,
        (args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var message: string = args.slice(1).join(' ');

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    bot.chat(message);
                }
            }
            
        }
    ));
    
    player.commands.push(new Command(
        "disconnect_bot", 
        "Отключить ботов",
        "disconnect_bot <никнеймы|*>",
        1,
        (args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    bots = bots.filter(x => x != bot);
                    bot.end();
                }
            }
            
        }
    ));
}