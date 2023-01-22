import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import { Player } from "../KiberKotletaPlayer";

export default function basicCommandsPlugin(player: Player) {
    player.commands.push(new Command(
        "help",
        "Список команд",
        "",
        0,
        () => {
            player.sendMessage(`KiberKotleta ${VERSION} by DarkCoder15`);
            player.sendMessage(`Всего ${player.commands.length} команд`);
            for (const command of player.commands) {
                player.sendMessage(`${command.name}${command.usage.length > 0 ? " " + command.usage : ""} => ${command.description}`);
            }
        }
    ));

    player.commands.push(new Command(
        "plugins",
        "Список плагинов",
        "",
        0,
        () => {
            player.sendMessage(`Всего ${player.plugins.length} плагинов`);
            for (const pl of player.plugins) {
                player.sendMessage(`${pl["name"]} ${pl["version"]} (licensed under ${pl["license"]})`);
                if (typeof pl["description"] === 'string') player.sendMessage(pl["description"]);
            }
        }
    ));

    player.commands.push(new Command(
        "modules",
        "Список модулей",
        "",
        0,
        () => {
            player.sendMessage(`KiberKotleta ${VERSION} by DarkCoder15`);
            player.sendMessage(`Всего ${player.modules.length} модулей`);
            for (const module of player.modules) {
                player.sendMessage(`${module.name} => ${module.description} §7[${module.state ? '§aВкл' : '§cВыкл'}§7]`);
            }
        }
    ));

    player.commands.push(new Command(
        "t",
        "Включить/отключить модуль",
        "<название модуля>",
        1,
        (p, args) => {
            var module = player.modules.find(x => x.name == args[0]);
            if (!module) return player.sendMessage("Модуль не найден");
            if (module.state) {
                player.sendMessage(`§7[§cВыкл§7] ${module.name}`);
                module.disable();
            } else {
                player.sendMessage(`§7[§aВкл§7] ${module.name}`);
                module.enable();
            }
        }
    ));
}