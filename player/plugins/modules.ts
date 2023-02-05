import { VERSION } from "../../KiberKotleta";
import Module from "../Module";
import { Player } from "../KiberKotletaPlayer";
import { Bot } from "mineflayer";
import PacketEvent from "../KiberKotletaPacketEvent";

export const DEFAULT_FLYING_SPEED = 0.049997005611658096;
export const DEFAULT_WALKING_SPEED = 0.10000000149011612;

export default function modulesPlugin(player: Player) {
    var lastAbilitiesPacket: any;

    var flight = new Module(
        "Flight",
        player.translate('module_Flight'),
        player
    );

    flight.on('enabled', () => {
        if (!lastAbilitiesPacket) {
            return flight.disable();
        }
        var packet = JSON.parse(JSON.stringify(lastAbilitiesPacket));
        if (packet.flags != 13 && packet.flags != 15 && packet.flags != 4 && packet.flags != 6 && packet.flags != 5) {
            packet.flags = packet.flags | 0x04;
        }
        player.sourceClient.write('abilities', packet);
    });

    flight.on('disabled', () => {
        if (!lastAbilitiesPacket) {
            return flight.disable();
        }
        player.sourceClient.write('abilities', lastAbilitiesPacket);
    });

    flight.on('packet', (packet: PacketEvent) => {
        if (packet.name == 'abilities' && packet.source == 'server') {
            lastAbilitiesPacket = packet.data;
            if (packet.data.flags != 13 && packet.data.flags != 15 && packet.data.flags != 4 && packet.data.flags != 6 && packet.data.flags != 5) {
                packet.data.flags = packet.data.flags | 0x04;
            }
            player.sourceClient.write('abilities', packet);
            packet.cancel = true;
        }
    });

    var speedboost = new Module(
        "SpeedBoost",
        player.translate('module_SpeedBoost'),
        player
    );

    speedboost.on('enabled', () => {
        if (!lastAbilitiesPacket) {
            return speedboost.disable();
        }
        var packet = JSON.parse(JSON.stringify(lastAbilitiesPacket));
        packet.walkingSpeed *= 5;
        packet.flyingSpeed *= 5;
        player.sourceClient.write('abilities', packet);
    });

    speedboost.on('disabled', () => {
        if (!lastAbilitiesPacket) {
            return speedboost.disable();
        }
        lastAbilitiesPacket.flyingSpeed = DEFAULT_FLYING_SPEED;
        lastAbilitiesPacket.walkingSpeed = DEFAULT_WALKING_SPEED;
        player.sourceClient.write('abilities', lastAbilitiesPacket);
    });

    speedboost.on('packet', (packet: PacketEvent) => {
        if (packet.name == 'abilities' && packet.source == 'server') {
            packet.data.walkingSpeed *= 5;
            packet.data.flyingSpeed *= 5;
            player.sourceClient.write('abilities', packet);
            packet.cancel = true;
        }
    });

    player.on('packet', (packet: PacketEvent) => {
        if (packet.name == 'abilities') {
            lastAbilitiesPacket = packet.data;
        }
    });

    var rabbit = new Module("Rabbit", player.translate('module_Rabbit'), player);

    rabbit.on('enabled', () => {
        player.sourceClient.write('entity_effect', {
            entityId: player.targetClient.entity.id,
            effectId: 8,
            amplifier: player.options.getModuleOptions("Rabbit").amplifier ?? 3,
            duration: 1000000 * 20,
            hideParticles: 7
        });
    });

    rabbit.on('disabled', () => {
        player.sourceClient.write('remove_entity_effect', {
            entityId: player.targetClient.entity.id,
            effectId: 8
        });
    });

    var nightvision = new Module("NightVision", player.translate('module_NightVision'), player);

    nightvision.on('enabled', () => {
        player.sourceClient.write('entity_effect', {
            entityId: player.targetClient.entity.id,
            effectId: 16,
            amplifier: 3,
            duration: 1000000 * 20,
            hideParticles: 7
        });
    });

    nightvision.on('disabled', () => {
        player.sourceClient.write('remove_entity_effect', {
            entityId: player.targetClient.entity.id,
            effectId: 16
        });
    });

    var autofish = new Module("AutoFish", player.translate('module_AutoFish'), player);

    autofish.on('enabled', () => {
        function fish(target: Bot) {
            if (!autofish.state) return;
            target.fish().then(() => {
                fish(target);
            }).catch((err) => {
                console.error("Fishing failed");
                console.error(err);
            });
        }
        fish(player.targetClient);
    });

    player.modules.push(flight);
    player.modules.push(speedboost);
    player.modules.push(rabbit);
    player.modules.push(autofish);
    player.modules.push(nightvision);
}