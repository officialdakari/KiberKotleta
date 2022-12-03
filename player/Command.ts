export default class Command {
    name: string;
    description: string;
    usage: string;
    minArgsCount: number;

    execute: Function;

    constructor(name: string, description: string, usage: string, minArgsCount: number, execute: Function) {
        this.name = name;
        this.description = description;
        this.usage = usage;
        this.minArgsCount = minArgsCount;
        this.execute = execute;
    }
};