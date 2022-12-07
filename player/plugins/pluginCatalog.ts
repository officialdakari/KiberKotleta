import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import fetch from "node-fetch";
import { Player } from "../KiberKotletaPlayer";
import { writeFileSync } from "fs";

export const PREFIX = "\u00A78[\u00A77Catalog\u00A78] \u00a7f";

export default function catalogPlugin(player: Player) {
    var cachedList: any;
    player.commands.push(
        new Command(
            "catalog",
            "Каталог плагинов",
            "",
            0,
            async () => {
                const f = await fetch("https://darkcoder15.tk/KiberKotleta/repo/list.json");
                const res: any[] = await f.json() as any;
                cachedList = res;
                player.sendMessage(
                    {
                        text: PREFIX + `${res.length} плагинов доступно`
                    }
                );
                for (const plugin of res) {
                    player.sendMessage(
                        {
                            text: PREFIX + `${plugin.name} ${plugin.version} by ${plugin.author} - ${plugin.description}`
                        }
                    );
                    player.sendMessage(
                        {
                            text: PREFIX + `Установка - ${player.options.commandPrefix}install ${plugin.name}`
                        }
                    );
                }
            }
        )
    );

    player.commands.push(
        new Command(
            "install",
            "Установка плагина",
            "<название плагина>",
            1,
            async ({ }, args: string[]) => {
                if (!cachedList) {
                    const f = await fetch("https://darkcoder15.tk/KiberKotleta/repo/list.json");
                    const res: any[] = await f.json() as any;
                    cachedList = res;
                }
                var plugin = cachedList.find(x => x.name == args[0]);
                if (!plugin) return player.sendMessage(
                    {
                        text: PREFIX + "Не найдено!"
                    }
                );
                const f = await fetch(plugin.url);
                const res: string = await f.text();
                if (!f.ok) return player.sendMessage(
                    {
                        text: PREFIX + `Ошибка загрузки (${f.status})`
                    }
                );
                writeFileSync(`./plugins/${plugin.name}.js`, res);
                player.sendMessage(
                    {
                        text: PREFIX + "Плагин установлен."
                    }
                );
                const p = require(`${__dirname}/../../plugins/${plugin.name}.js`);
                if (typeof p == "function") {
                    player.loadPlugin(p);
                } else if (typeof p["default"] == "function") {
                    player.loadPlugin(p["default"]);
                }
            }
        )
    );
}