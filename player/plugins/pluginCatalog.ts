import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import fetch from "node-fetch";
import { Player } from "../KiberKotletaPlayer";
import { writeFileSync, existsSync } from "fs";

export const PREFIX = "\u00A78[\u00A77Catalog\u00A78] \u00a7f";

export default function catalogPlugin(player: Player) {
    var cachedList: any;
    player.commands.push(
        new Command(
            "catalog",
            player.translate('cmd_catalog_desc'),
            "",
            0,
            async () => {
                const f = await fetch("https://darkcoder15.tk/KiberKotleta/repo/list.json");
                const res: any[] = await f.json() as any;
                cachedList = res;
                player.sendMessage(
                    {
                        text: PREFIX + player.translate('cmd_catalog_count', res.length)
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
                            text: PREFIX + player.translate('cmd_catalog_install', `${player.options.commandPrefix}install ${plugin.name}`)
                        }
                    );
                }
            }
        )
    );

    player.commands.push(
        new Command(
            "install",
            player.translate('cmd_install_desc'),
            player.translate('cmd_install_usage'),
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
                        text: PREFIX + player.translate('err_not_found')
                    }
                );
                const f = await fetch(plugin.url);
                const res: string = await f.text();
                const path = `./plugins/${plugin.name}.js`;
                if (!f.ok) return player.sendMessage(
                    {
                        text: PREFIX + player.translate('cmd_install_status_code', `${f.status} ${f.statusText}`)
                    }
                );
                if (existsSync(path)) return player.sendMessage(
                    {
                        text: PREFIX + player.translate('cmd_install_exists')
                    }
                );
                writeFileSync(path, res);
                player.sendMessage(
                    {
                        text: PREFIX + player.translate('cmd_install_success')
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