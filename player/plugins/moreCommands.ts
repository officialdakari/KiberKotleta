import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import { Player } from "../KiberKotletaPlayer";

export default function moreCommandsPlugin(player: Player) {
    player.commands.push(
        new Command(
            "find",
            player.translate('cmd_find_desc'),
            player.translate('cmd_find_usage'),
            1,
            async (p, args: string[]) => {
                const blockName = args[0];
                const b = player.mcData.blocksByName[blockName];
                if (!b) return await player.sendMessage(player.translate('cmd_find_not_a_block'));
                const f = player.targetClient.findBlock({
                    matching: b.id,
                    maxDistance: 512,
                    count: 1,
                    point: player.targetClient.entity.position
                });
                if (!f) return await player.sendMessage(player.translate('cmd_find_none'));
                await player.sendMessage(player.translate('cmd_find_success', f.position.x, f.position.y, f.position.z));
            }
        )
    );
}