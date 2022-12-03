import { createBot } from "mineflayer";
import { createServer } from "minecraft-protocol";
import { readdirSync } from "fs";
import inject from "./player/KiberKotletaPlayer";
import getArgument from "./args";
import { text } from "input";

export const VERSION = "1.7.0-BETA";

const plugins = [];

export function getPlugins() {
    return plugins;
}

export default async function start() {

    console.log("KiberKotleta | Версия: " + VERSION);
    console.log("#kiberkotleta #kiberkotleta-help at Cyclone IRC");
    console.log("Cyclone IRC Web - https://darkcoder15.tk/irc/");
    console.log("");
    console.log("Сайт - https://darkcoder15.tk/KiberKotleta/");

    console.log("Загружаем плагины...");
    for (const pluginDir of readdirSync("./plugins")) {
        try {
            var pluginPath = "./plugins/" + pluginDir;
            var pkg = require(pluginPath + "/package.json");
            console.log(`${pkg.name} v${pkg.version}`);
            var module = require(pluginPath + "/" + pkg.main);
            if (typeof module === "function") module();
            else if (typeof module.default === "function") module.default();
            else {
                console.warn(`Плагин ${pluginDir} не экспортирует функцию старта`);
            }
            module.package = pkg;
            plugins.push(module);
        } catch (error) {
            console.error(`Не удалось загрузить ${pluginDir}`);
            console.error(error);
        }
    }
    console.log(`Загружено ${plugins.length} плагинов`);

    var serverIP: string = getArgument("--server") ?? await text("Введите IP-адрес сервера");
    var serverPortStr: string = getArgument("--port") ?? await text("Введите порт сервера");
    if (!/^\d+$/.test(serverPortStr)) return console.error("Порт сервера должен быть целым числом.");
    var serverPort: number = Number.parseInt(serverPortStr);

    const server = createServer({
        "online-mode": false,
        enforceSecureProfile: false,
        version: "1.19",
        maxPlayers: 1,
        motd: "§6KiberKotleta §b§l" + VERSION,
        port: 25566
    });

    server.on('login', (client) => {
        inject(client, serverIP, serverPort);
    });

}

export { Player } from "./player/KiberKotletaPlayer";
export { default as Module } from "./player/Module";
export { default as Command } from "./player/Command";
export { Options } from "./player/Options";
export { default as TextComponent } from "./player/minecraft/TextComponent";