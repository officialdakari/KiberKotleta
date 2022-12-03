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
    console.log("GitHub: https://github.com/DarkCoder15/KiberKotleta");
    console.log("Gitter: https://gitter.im/DarkCoder15_/KiberKotleta");
    console.log("");
    console.log("Сайт - https://darkcoder15.tk/KiberKotleta/");

    var serverIP: string = getArgument("--server") ?? await text("Введите IP-адрес сервера");
    var serverPortStr: string = getArgument("--port") ?? await text("Введите порт сервера");
    if (!/^\d+$/.test(serverPortStr)) return console.error("Порт сервера должен быть целым числом.");
    var serverPort: number = Number.parseInt(serverPortStr);

    const server = createServer({
        "online-mode": false,
        enforceSecureProfile: false,
        version: "1.19",
        maxPlayers: 20,
        motd: "§6KiberKotleta §b§l" + VERSION,
        port: 25566
    });

    console.log("КиберКотлета приготовилась. Заходите на сервер 127.0.0.1:25566");

    server.on('login', (client) => {
        inject(client, serverIP, serverPort);
    });

}

export { Player } from "./player/KiberKotletaPlayer";
export { default as Module } from "./player/Module";
export { default as Command } from "./player/Command";
export { Options } from "./player/Options";
export { default as TextComponent } from "./player/minecraft/TextComponent";