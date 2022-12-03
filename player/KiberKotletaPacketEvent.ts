import { States } from "minecraft-protocol";

export default class PacketEvent {
    name: string;
    state: States;
    data: any;
    cancel: boolean;
    source: 'server' | 'client';

    constructor(name: string, state: States, data: any, source: 'server' | 'client') {
        this.name = name;
        this.state = state;
        this.data = data;
        this.cancel = false;
        this.source = source;
    }
}