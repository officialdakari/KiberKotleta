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
        this.player.options.enabledModules.push(this.name);
        this.player.options.save();
    }

    disable() {
        this.state = false;
        this.emit("disabled");
        this.player.options.enabledModules = this.player.options.enabledModules.filter(x => x != this.name);
        this.player.options.save();
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