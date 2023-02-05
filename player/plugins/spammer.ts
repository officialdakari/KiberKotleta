import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import { Player } from "../KiberKotletaPlayer";
import * as uuid from "uuid";

export default function helpPlugin(player: Player) {
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