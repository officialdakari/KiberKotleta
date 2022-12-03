import { EventEmitter } from "events";
import { Player } from "../KiberKotleta";
import TextComponent from "./minecraft/TextComponent";

export default class Module extends EventEmitter {

    name: string;
    description: string;
    state: boolean;
    player: Player;

    enable() {
        this.state = true;
        this.emit("enabled");
    }

    disable() {
        this.state = false;
        this.emit("disabled");
    }

    sendMessage(message: string | TextComponent | TextComponent[]) {
        this.player.sendMessage(message, `§8[§7${this.name}§8] `);
    }

    constructor(name: string, description: string, player: Player) {
        super();
        this.name = name;
        this.description = description;
        this.player = player;
        this.state = false;
    }

}