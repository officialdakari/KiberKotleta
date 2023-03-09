import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import { Player } from "../KiberKotletaPlayer";
import { createServer } from "minecraft-protocol";
import PacketEvent from "../KiberKotletaPacketEvent";

const replayServer = createServer({
    port: 25567,
    "online-mode": false,
    motd: '\u00A7bKiberKotleta ' + VERSION + ' Replay Server',
    version: '1.19'
});

// Camera, roll, and... ACTION
export default function replayPlugin(player: Player) {

    var replayBuffer = [];
    var record: boolean | number = false;

    player.commands.push(
        new Command(
            'record',
            player.translate('cmd_record_desc'),
            '',
            0,
            async () => {
                record = Date.now();
                replayBuffer = [...player.packetBuffer.map(x => [player.packetBuffer.indexOf(x) * 100, x])];
                player.sendMessage(player.translate('cmd_record_success'));
            }
        )
    );

    player.commands.push(
        new Command(
            'end_record',
            player.translate('cmd_end_record_desc'),
            '',
            0,
            async () => {
                player.sendMessage(player.translate('cmd_end_record_success'));
                record = false;
            }
        )
    );

    player.on('packet', async (event: PacketEvent) => {
        if (!record) return;
        if (event.source != 'client') {
            replayBuffer.push([Date.now() - (record as number), event]);
        } else {
            if (event.name == 'held_item_slot') replayBuffer.push([Date.now() - (record as number), event]);
            if (event.name == 'position' || event.name == 'position_look' || event.name == 'look') {
                replayBuffer.push([Date.now() - (record as number), {
                    x: event.data.x,
                    y: event.data.y,
                    z: event.data.z,
                    yaw: event.data.yaw ?? player.yaw,
                    pitch: event.data.pitch ?? player.pitch,
                    flags: 0x00
                }]);
            }
        }
    });

    replayServer.on('login', async (watcher) => {
        if (watcher.username == player.username) {
            for (const packet of replayBuffer) {
                console.log(packet);
                setTimeout(() => {
                    watcher.write(packet[1].name, packet[1].data);
                }, packet[0]);
            }
        }
    });

}