import { States } from "minecraft-protocol";

export default class PacketEvent {
    name: string;
    state: States;
    data: any;
    cancel: boolean;
    source: 'server' | 'client' | 'kiberkotleta';

    constructor(name: string, state: States, data: any, source: 'server' | 'client' | 'kiberkotleta') {
        this.name = name;
        this.state = state;
        this.data = data;
        this.cancel = false;
        this.source = source;
    }
}