import { ServerClient } from "minecraft-protocol";
import { Bot } from "mineflayer";
import { Player } from "./KiberKotletaPlayer";
import { readdirSync } from "fs";
import * as path from "path";

export default function loadPlugins(player: Player, client: ServerClient, target: Bot) {

    const internalPlugins = ["anvil",
        "bed",
        "block_actions",
        "blocks",
        "book",
        "boss_bar",
        "breath",
        "chat",
        "creative",
        "digging",
        "enchantment_table",
        "entities",
        "experience",
        "explosion",
        "fishing",
        "furnace",
        "game",
        "generic_place",
        "health",
        "inventory",
        "kick",
        "place_block",
        "place_entity",
        "rain",
        "ray_trace",
        "resource_pack",
        "scoreboard",
        "settings",
        "simple_inventory",
        "sound",
        "spawn_point",
        "tablist",
        "team",
        "time",
        "title"
    ];

    for (const internalPluginName of internalPlugins) {
        target.loadPlugin(require(`mineflayer/lib/plugins/${internalPluginName}`));
    }
    
    for (const pluginName of readdirSync(path.join(__dirname, "plugins"))) {
        const pluginPath = path.join(__dirname, "plugins", pluginName);
        if (!pluginPath.endsWith('.js')) continue;
        const plugin = require(pluginPath);
        if (typeof plugin !== "function" && typeof plugin.default == "function") {
            player.loadPlugin(plugin.default);
        } else if (typeof plugin === "function") {
            player.loadPlugin(plugin);
        } else {
            console.error(`Не удалось загрузить плагин: ${pluginPath}`);
        }
    }

}