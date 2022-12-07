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
    
    for (const pluginName of readdirSync(path.join(".", "plugins"))) {
        const pluginPath = path.join(__dirname, "..", "plugins", pluginName);
        if (pluginPath.endsWith(".js")) {
            console.log("Loading: " + pluginPath);
            const plugin = require(pluginPath);
            plugin.pluginInfo = {
                name: plugin.name ?? pluginPath,
                version: plugin.version ?? "1.0.0",
                description: plugin.description ?? "None",
                license: plugin.license ?? "None"
            };
            if (typeof plugin == "function") {
                player.loadPlugin(plugin);
            } else if (typeof plugin["default"] == "function") {
                player.loadPlugin(plugin["default"]);
            }
            continue;
        }
        try {
            const packageJson = require(path.join(pluginPath, 'package.json'));
            const plugin = require(path.join(pluginPath, packageJson.main));
            plugin.pluginInfo = packageJson;
            if (typeof plugin == "function") {
                player.loadPlugin(plugin);
            } else if (typeof plugin["default"] == "function") {
                player.loadPlugin(plugin["default"]);
            }
        } catch (error) {
            console.error("Can't load plugin " + pluginPath);
            console.error(error);
        }
    }

}