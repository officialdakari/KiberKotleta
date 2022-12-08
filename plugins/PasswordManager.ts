import { Player, Command } from "../KiberKotleta";

export const PREFIX = "\u00A78[\u00A77PasswordManager\u00A78] \u00A7f";

export default function sixHighLoads(p: Player) {
    var mod = p.options.getModuleOptions("PasswordManager");
    var lastpwd: string;
    p.targetClient.once('spawn', () => {
        var pwdFor = mod["passwd_" + p.host + ":" + p.port];
        if (!pwdFor) return p.sendMessage({
            text: PREFIX + "Пароль для этого сервера не указан. Укажите с помощью " + p.options.commandPrefix + "addpwd <пароль>"
        });
        p.targetClient.chat(`/login ${pwdFor}`);
    });

    p.sourceClient.on('packet', (data, { name }) => {
        if (name == 'chat_message') {
            if (data.message.startsWith('/register ') || data.message.startsWith('/reg ') ||
                data.message.startsWith('/l ') || data.message.startsWith('/login ')) {
                var a = data.message.split(' ');
                var passwd = a[1];
                var pwdFor = mod["passwd_" + p.host + ":" + p.port];
                if (!pwdFor) {
                    lastpwd = passwd;
                    p.sendMessage({
                        text: PREFIX + "Сохранить пароль? Используйте " + p.options.commandPrefix + "savepwd чтобы сохранить."
                    });
                }
            }
        }
    });

    p.commands.push(
        new Command(
            "addpwd",
            "Сохранить пароль для сервера",
            "<пароль>",
            1,
            ({ }, args: string[]) => {
                var pwd = args[0];
                mod["passwd_" + p.host + ":" + p.port] = pwd;
                p.options.setModuleOptions("PasswordManager", mod);
                p.sendMessage({
                    text: PREFIX + "Пароль сохранён."
                });
            }
        )
    );

    p.commands.push(
        new Command(
            "savepwd",
            "Сохранить пароль для сервера",
            "",
            0,
            ({ }, args: string[]) => {
                if (!lastpwd) return p.sendMessage({
                    text: PREFIX + "\u00A7cПароль уже сохранён."
                });
                mod["passwd_" + p.host + ":" + p.port] = lastpwd;
                p.options.setModuleOptions("PasswordManager", mod);
                p.sendMessage({
                    text: PREFIX + "Пароль сохранён."
                });
            }
        )
    );

    p.commands.push(
        new Command(
            "rmpwd",
            "Удалить пароль для сервера",
            "",
            0,
            ({ }, args: string[]) => {
                if (!mod["passwd_" + p.host + ":" + p.port]) return p.sendMessage({
                    text: PREFIX + "\u00A7cПароль не сохранён."
                });
                delete mod["passwd_" + p.host + ":" + p.port];
                p.options.setModuleOptions("PasswordManager", mod);
                p.sendMessage({
                    text: PREFIX + "Пароль удалён."
                });
            }
        )
    );
}