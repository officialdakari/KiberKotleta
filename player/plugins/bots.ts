import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import * as mineflayer from 'mineflayer';
import * as pathfinder from 'mineflayer-pathfinder';
import MinecraftData from "minecraft-data";
import { Player } from "../KiberKotletaPlayer";
import * as pvp from "mineflayer-pvp";

var bots: mineflayer.Bot[] = [];

export function getBots() {
    return bots;    
}

export const PREFIX: string = "\u00A78[\u00A77Bots\u00A78] \u00A7f";

var bot_fishing = true;
var bot_mining: any = {};

export function getBotMining(bot: any) {
    return bot_mining[bot.username ?? bot];
}

export default function botsPlugin(player: Player) {
    player.commands.push(new Command(
        "connect_bot",
        player.translate('cmd_connect_bot_desc'),
        player.translate('cmd_connect_bot_usage'),
        1,
        (player: Player, args: string[]) => {
            var nickname: string = args[0];
            if (!/^[a-zA-Z0-9_]+$/.test(nickname)) return player.sendMessage({ text: PREFIX + player.translate('cmd_connect_bot_invalid_nick') });
            var bot: mineflayer.Bot = mineflayer.createBot({
                username: nickname,
                brand: `KiberKotleta Bot`,
                host: player.host,
                port: player.port,
                physicsEnabled: true,
                viewDistance: 'tiny',
                version: player.version
            });
            bot.loadPlugin(pathfinder.pathfinder);
            bot.loadPlugin(pvp.plugin);

            bots.push(bot);
            bot.on('end', () => {
                bots = bots.filter(x => x != bot);
            });
        }
    ));

    player.commands.push(new Command(
        "cancel_bot",
        player.translate('cmd_cancel_bot_desc'),
        player.translate('cmd_cancel_bot_usage'),
        1,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    bot.pathfinder.stop();
                    bot.pathfinder.setGoal(null);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "unfight_bot",
        player.translate('cmd_unfight_bot_desc'),
        player.translate('cmd_unfight_bot_usage'),
        1,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var who: string = args[1];


            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    bot.pvp.stop();
                }
            }

        }
    ));

    player.commands.push(new Command(
        "fight_bot",
        player.translate('cmd_fight_bot_desc'),
        player.translate('cmd_fight_bot_usage'),
        2,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var who: string = args[1];


            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    var p = bot.players[who];
                    if (!p.entity) {
                        return player.sendMessage({
                            text: PREFIX + player.translate('cmd_fight_bot_doesnt_see_warn', bot.username)
                        });
                    }
                    bot.pvp.attackRange = 3;
                    bot.pvp.attack(p.entity);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "equip_bot",
        player.translate('cmd_equip_bot_desc'),
        player.translate('cmd_equip_bot_usage'),
        2,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var what: string = args[1];
            var where: string = args[2] ?? 'hand';
            if (!['head', 'torso', 'legs', 'feet', 'hand', 'offhand'].includes(where)) return player.sendMessage({
                text: PREFIX + player.translate('cmd_equip_bot_isnt_right_place', where)
            });

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    var i = bot.inventory.items().find(x => x.name == what);
                    if (!i) {
                        return player.sendMessage({
                            text: PREFIX + player.translate('cmd_equip_bot_no_such_item', bot.username)
                        });
                    }
                    bot.equip(i, where as mineflayer.EquipmentDestination);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "toss_bot",
        player.translate('cmd_toss_bot_desc'),
        player.translate('cmd_toss_bot_usage'),
        2,
        async (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var what: string = args[1];
            var countStr: string = args[2] ?? '0';
            if (!/^\d+$/.test(countStr)) return player.sendMessage({
                text: PREFIX + player.translate('cmd_toss_bot_nan', countStr)
            });
            var count = Number(countStr);

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    var items = bot.inventory.items().filter(x => x.name == what && x.count >= count);
                    if (items.length == 0) {
                        return player.sendMessage({
                            text: PREFIX + player.translate('cmd_toss_bot_no_such_item', bot.username)
                        });
                    }
                    for (const i of items) {
                        await bot.tossStack(i);
                    }
                }
            }

        }
    ));

    player.commands.push(new Command(
        "come_bot",
        player.translate('cmd_come_bot_desc'),
        player.translate('cmd_come_bot_usage'),
        1,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    var pos = player.position;
                    bot.pathfinder.setMovements(new pathfinder.Movements(bot, MinecraftData(bot.version)));
                    bot.pathfinder.setGoal(new pathfinder.goals.GoalNear(pos.x, pos.y, pos.z, 2));
                }
            }

        }
    ));

    player.commands.push(new Command(
        "goto_bot",
        player.translate('cmd_goto_bot_desc'),
        player.translate('cmd_goto_bot_usage'),
        4,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var coordsStr = args.slice(1);
            if (coordsStr.find(x => !/^-?\d+/.test(x))) return player.sendMessage({
                text: PREFIX + player.translate("cmd_goto_bot_nan", coordsStr.find(x => !/^-?\d+/.test(x)))
            });

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    var pos = {
                        x: Number(coordsStr[0]),
                        y: Number(coordsStr[1]),
                        z: Number(coordsStr[2])
                    };
                    bot.pathfinder.setMovements(new pathfinder.Movements(bot, MinecraftData(bot.version)));
                    bot.pathfinder.setGoal(new pathfinder.goals.GoalNear(pos.x, pos.y, pos.z, 2));
                }
            }

        }
    ));

    async function fishLoop(bot: mineflayer.Bot) {
        try {
            await bot.fish();
        } catch (error) {
            console.error(error);
            player.sendMessage({
                text: PREFIX + player.translate('bot_fish_error', bot.username)
            });
        }
        if (bot_fishing == true) {
            fishLoop(bot);
        }
    }

    async function mineLoop(bot: mineflayer.Bot) {
        const block = bot.findBlock({
            matching: player.mcData.blocksByName[bot_mining[bot.username]].id,
            point: bot.entity.position,
            count: 1,
            maxDistance: 100
        });
        if (!block) {
            return player.sendMessage({
                text: PREFIX + player.translate('bot_finished_mining', bot.username)
            });
        }
        try {
            bot.pathfinder.setMovements(new pathfinder.Movements(bot, MinecraftData(bot.version)));
            await bot.pathfinder.goto(new pathfinder.goals.GoalNear(block.position.x, block.position.y, block.position.z, 3));
            await bot.equip(bot.pathfinder.bestHarvestTool(block), 'hand');
            await bot.dig(block);
            await bot.pathfinder.goto(new pathfinder.goals.GoalNear(block.position.x, block.position.y, block.position.z, 0.01));
        } catch (error) {
            console.error(error);
            player.sendMessage({
                text: PREFIX + player.translate('bot_failed_mining', bot.username)
            });
        }
        if (bot_mining[bot.username]) {
            mineLoop(bot);
        }
    }

    player.commands.push(new Command(
        "fish_bot",
        player.translate('cmd_fish_bot_desc'),
        player.translate('cmd_fish_bot_usage'),
        1,
        async (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');

            bot_fishing = true;

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    fishLoop(bot);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "mine_bot",
        player.translate('cmd_mine_bot_desc'),
        player.translate('cmd_mine_bot_usage'),
        2,
        async (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');


            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    bot_mining[bot.username] = args[1];
                    mineLoop(bot);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "cancelmine_bot",
        player.translate('cmd_cancelmine_bot_desc'),
        player.translate('cmd_cancelmine_bot_usage'),
        1,
        async (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    delete bot_mining[bot.username];
                }
            }
        }
    ));

    player.commands.push(new Command(
        "cancelfish_bot",
        player.translate('cmd_cancelfish_bot_desc'),
        "",
        0,
        async (player: Player, args: string[]) => {
            bot_fishing = false;
        }
    ));

    player.commands.push(new Command(
        "chat_bot",
        player.translate('cmd_chat_bot_desc'),
        player.translate('cmd_chat_bot_usage'),
        2,
        (player: Player, args: string[]) => {
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
        "eval_bot",
        player.translate('cmd_eval_bot_desc'),
        player.translate('cmd_eval_bot_usage'),
        2,
        async (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var message: string = args.slice(1).join(' ');

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    eval(message);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "disconnect_bot",
        player.translate('cmd_disconnect_bot_desc'),
        player.translate('cmd_disconnect_bot_usage'),
        1,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    bot.end();
                    bots = bots.filter(x => x != bot);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "list_bot",
        player.translate('cmd_list_bot_desc'),
        "",
        0,
        (player: Player, args: string[]) => {
            player.sendMessage(
                {
                    text: PREFIX + player.translate('cmd_list_bot_msg', bots.length, bots.map(x => x.username).join(', '))
                }
            );
        }
    ));

    player.commands.push(new Command(
        "info_bot",
        player.translate('cmd_info_bot_desc'),
        player.translate('cmd_info_bot_usage'),
        1,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            player.sendMessage({
                text: PREFIX + player.translate('cmd_info_bot_start')
            });
            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    player.sendMessage({
                        text: PREFIX + player.translate('cmd_info_bot_bot_info', bot.username)
                    });
                    player.sendMessage({
                        text: PREFIX + player.translate('cmd_info_bot_inventory', bot.inventory.items().map(x => `${x.name} x${x.count}`).join(', '))
                    });
                    player.sendMessage({
                        text: PREFIX + player.translate('cmd_info_bot_position', bot.entity.position.x, bot.entity.position.y, bot.entity.position.z)
                    });
                    player.sendMessage({
                        text: PREFIX + player.translate('cmd_info_bot_health', bot.health)
                    });
                    player.sendMessage({
                        text: PREFIX + player.translate('cmd_info_bot_food_level', bot.food)
                    });
                }
            }
        }
    ));
}