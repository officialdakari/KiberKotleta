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
var bot_mining: string | never = "diamond_ore";

export default function botsPlugin(player: Player) {
    player.commands.push(new Command(
        "connect_bot",
        "Добавить бота на сервер",
        "<никнейм>",
        1,
        (player: Player, args: string[]) => {
            var nickname: string = args[0];
            if (!/^[a-zA-Z0-9_]+$/.test(nickname)) return player.sendMessage({ text: PREFIX + 'Этот никнейм не подходит.' });
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
        "Отменить поиск пути",
        "<никнеймы|*>",
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
        "Перестать драться",
        "<никнеймы|*>",
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
        "Драться",
        "<никнеймы|*> <с кем>",
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
                            text: PREFIX + `${bot.username} не видит его`
                        });
                    }
                    bot.pvp.attack(p.entity);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "equip_bot",
        "Надеть что-то",
        "<никнеймы|*> <что> [куда hand|head|torso|legs|feet|off-hand (hand)]",
        2,
        (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var what: string = args[1];
            var where: string = args[2] ?? 'hand';
            if (!['head', 'torso', 'legs', 'feet', 'hand', 'offhand'].includes(where)) return player.sendMessage({
                text: PREFIX + `${where} это не место куда можно надеть вещь.`
            });

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    var i = bot.inventory.items().find(x => x.name == what);
                    if (!i) {
                        return player.sendMessage({
                            text: PREFIX + `${bot.username} не нашёл эту вещь у себя в инвентаре.`
                        });
                    }
                    bot.equip(i, where as mineflayer.EquipmentDestination);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "toss_bot",
        "Выкинуть что-то",
        "<никнеймы|*> <что> [в каком количестве]",
        2,
        async (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');
            var what: string = args[1];
            var countStr: string = args[2] ?? '0';
            if (!/^\d+$/.test(countStr)) return player.sendMessage({
                text: PREFIX + `${countStr} - это не число.`
            });
            var count = Number(countStr);

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    var items = bot.inventory.items().filter(x => x.name == what && x.count >= count);
                    if (items.length == 0) {
                        return player.sendMessage({
                            text: PREFIX + `${bot.username} не нашёл эту вещь у себя в инвентаре.`
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
        "Привести ботов к Вам",
        "<никнеймы|*>",
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

    async function fishLoop(bot: mineflayer.Bot) {
        try {
            await bot.fish();
        } catch (error) {
            console.error(error);
            player.sendMessage({
                text: PREFIX + "Не удалось порыбачить"
            });
        }
        if (bot_fishing == true) {
            fishLoop(bot);
        }
    }

    async function mineLoop(bot: mineflayer.Bot) {
        const block = bot.findBlock({
            matching: player.mcData.blocksByName[bot_mining].id,
            point: bot.entity.position,
            count: 1,
            maxDistance: 100
        });
        if (!block) {
            return player.sendMessage({
                text: PREFIX + "Больше нет блоков поблизости"
            });
        }
        try {
            bot.pathfinder.setMovements(new pathfinder.Movements(bot, MinecraftData(bot.version)));
            await bot.pathfinder.goto(new pathfinder.goals.GoalNear(block.position.x, block.position.y, block.position.z, 3));
            bot.equip(bot.pathfinder.bestHarvestTool(block), 'hand');
            await bot.dig(block);
            await bot.pathfinder.goto(new pathfinder.goals.GoalNear(block.position.x, block.position.y, block.position.z, 0.01));
        } catch (error) {
            console.error(error);
            player.sendMessage({
                text: PREFIX + "Не удалось копать"
            });
        }
        if (bot_mining) {
            mineLoop(bot);
        }
    }

    player.commands.push(new Command(
        "fish_bot",
        "Рыбачить",
        "<никнеймы|*>",
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
        "Копать",
        "<никнеймы|*> <ID блока>",
        2,
        async (player: Player, args: string[]) => {
            var all = args[0] == '*';
            var nicknames: string[] = args[0].split(',');

            bot_mining = args[1];

            for (const bot of bots) {
                if (all || nicknames.includes(bot.username)) {
                    mineLoop(bot);
                }
            }

        }
    ));

    player.commands.push(new Command(
        "cancelmine_bot",
        "Отменить копание",
        "",
        0,
        async (player: Player, args: string[]) => {
            bot_mining = null;
        }
    ));

    player.commands.push(new Command(
        "cancelfish_bot",
        "Отменить рыбалку",
        "",
        0,
        async (player: Player, args: string[]) => {
            bot_fishing = false;
        }
    ));

    player.commands.push(new Command(
        "chat_bot",
        "Написать в чат от имени ботов",
        "<никнеймы|*> <сообщение...>",
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
        "Исполнить код на каждого бота",
        "<никнеймы|*> <код...>",
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
        "Отключить ботов",
        "<никнеймы|*>",
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
        "Список ботов",
        "",
        0,
        (player: Player, args: string[]) => {
            player.sendMessage(
                {
                    text: PREFIX + `${bots.length} ботов на сервере: ${bots.map(x => x.username).join(', ')}`
                }
            );
        }
    ));

    player.commands.push(new Command(
        "info_bot",
        "Информация ботов",
        "",
        0,
        (player: Player, args: string[]) => {
            player.sendMessage({
                text: PREFIX + `Информация ботов`
            });
            for (const bot of bots) {
                player.sendMessage({
                    text: PREFIX + `Начало ${bot.username}`
                });
                player.sendMessage({
                    text: PREFIX + bot.inventory.items().map(x => `${x.name} x${x.count}`).join(', ')
                });
                player.sendMessage({
                    text: PREFIX + `${bot.entity.position.x} ${bot.entity.position.y} ${bot.entity.position.z}`
                });
                player.sendMessage({
                    text: PREFIX + `Конец ${bot.username}`
                });
            }
        }
    ));
}