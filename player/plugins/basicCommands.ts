import { VERSION } from "../../KiberKotleta";
import Command from "../Command";
import { Player } from "../KiberKotletaPlayer";

export default function basicCommandsPlugin(player: Player) {
    player.commands.push(new Command(
        "help",
        player.translate('cmd_help_desc'),
        "",
        0,
        () => {
            player.sendMessage(player.translate('kiberkotleta_version_author', VERSION));
            player.sendMessage(player.translate('help_parameter_guide'));
            player.sendMessage(player.translate('help_commands_count'), player.commands.length);
            for (const command of player.commands) {
                player.sendMessage(`${command.name}${command.usage.length > 0 ? " " + command.usage : ""} => ${command.description}`);
            }
        }
    ));

    player.commands.push(new Command(
        "plugins",
        player.translate('cmd_plugins_desc'),
        "",
        0,
        () => {
            player.sendMessage(player.translate('cmd_plugins_count', player.plugins.length));
            for (const pl of player.plugins) {
                player.sendMessage(`${pl["name"]} ${pl["version"]} (licensed under ${pl["license"]})`);
                if (typeof pl["description"] === 'string') player.sendMessage(pl["description"]);
            }
        }
    ));

    player.commands.push(new Command(
        "modules",
        player.translate('cmd_modules_desc'),
        "",
        0,
        () => {
            player.sendMessage(player.translate('kiberkotleta_version_author', VERSION));
            player.sendMessage(player.translate('cmd_modules_count', player.modules.length));
            for (const module of player.modules) {
                player.sendMessage(`${module.name} => ${module.description} §7[${module.state ? player.translate('generic_on') : player.translate('generic_off')}§7]`);
            }
        }
    ));

    player.commands.push(new Command(
        "conf",
        player.translate('cmd_conf_desc'),
        player.translate('cmd_conf_usage'),
        1,
        (p, args: string[]) => {
            var module = player.options.getModuleOptions(args[0]);
            if (args.length == 1) {
                var k = Object.keys(module);
                player.sendMessage(player.translate('cmd_conf_params_list', k.length, k.join(', ')));
            } else if (args.length == 2) {
                player.sendMessage(player.translate('cmd_conf_param_value', args[1], JSON.stringify(module[args[1]])));
            } else {
                var v = JSON.parse(args.slice(2).join(' '));
                module[args[1]] = v;
                player.options.save();
                player.sendMessage(player.translate('cmd_conf_param_update'));
            }
        }
    ));

    player.commands.push(new Command(
        "t",
        player.translate('cmd_t_desc'),
        player.translate('cmd_t_usage'),
        1,
        (p, args) => {
            var module = player.modules.find(x => x.name == args[0]);
            if (!module) return player.sendMessage(player.translate('err_module_not_found'));
            if (module.state) {
                player.sendMessage(player.translate('generic_module_state', player.translate('generic_off'), module.name));
                module.disable();
            } else {
                player.sendMessage(player.translate('generic_module_state', player.translate('generic_on'), module.name));
                module.enable();
            }
        }
    ));

    player.commands.push(new Command(
        "locale",
        player.translate('cmd_locale_desc'),
        player.translate('cmd_locale_usage'),
        1,
        (p, args) => {
            player.options.locale = args[0];
            player.options.save();
            player.sendMessage(player.translate('cmd_locale_changed', args[0]));
        }
    ));
}