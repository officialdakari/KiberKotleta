import { existsSync, writeFileSync } from "fs";

export class Options {
    commandPrefix: string;
    messagePrefix: string;

    modules: any;

    getModuleOptions(moduleName: string): any | never {
        if (!this.modules[moduleName]) this.setModuleOptions(moduleName);
        return this.modules[moduleName];
    }

    setModuleOptions(moduleName: string, options?: any, override?: boolean) {
        if (override)
            this.modules[moduleName] = options ?? {};
        else
            this.modules[moduleName] = Object.assign(this.modules[moduleName] ?? {}, options);
        this.save();
    }

    hasModule(moduleName: string) {
        if (this.modules[moduleName]) return true;
        return false;
    }

    username: string;
    locale: string;
    get path() {
        return `./options/${this.username}.json`;
    }

    save() {
        writeFileSync(this.path, JSON.stringify(this));
    }

    constructor() {
        this.commandPrefix = ".";
        this.locale = "en_US";
        this.messagePrefix = "§8(§2К§cК§8) §r§7";
        this.modules = {};
    }
}

export default function getOptions(username: string): Options {
    var optionsPath = `../options/${username}.json`;
    var options: Options = new Options();
    options.username = username;
    if (existsSync(optionsPath)) options = Object.assign(options, require(optionsPath));
    else options.save();

    return options;
}