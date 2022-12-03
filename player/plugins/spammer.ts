import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import { Player } from "../KiberKotletaPlayer";
import * as uuid from "uuid";

export default function helpPlugin(player: Player) {
    var i: NodeJS.Timer;
    var spammed: number = 0;
    player.commands.push(new Command(
        "spam",
        "Спам сообщениями",
        "<количество> <задержка, с> <сообщение>",
        3,
        (player: Player, args: string[]) => {
            spammed = 0;
            var count = parseInt(args[0]);
            var interval = parseFloat(args[1]);
            var message = args.slice(2).join(' ');
            i = setInterval(() => {
                spammed++;
                if (spammed >= count) {
                    player.sendMessage("Спам завершён");
                    return clearInterval(i);
                }
                player.targetClient.chat(message.replace(/%random%/g, uuid.v4().replace(/\-/g, '')));
            }, interval * 1e3);
            player.sendMessage("Спам начат");
        }
    ));
    player.commands.push(new Command(
        "cancelspam",
        "Отменить спам",
        "",
        0,
        (player: Player, args: string[]) => {
            if (i) {
                clearInterval(i);
                player.sendMessage("Спам отменён");
            } else {
                player.sendMessage("Спам ещё не начинался.");
            }
        }
    ));
}