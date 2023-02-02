export default interface TextComponent {
    text: string;
    selector?: string | never;
    color?: 'red' | 'yellow' | 'gold' | 'black' | 'white' | 'gray' | 'green' | 'dark_red' | 'dark_green' | 'cyan' | 'dark_cyan' | 'dark_gray' | 'blue' | 'dark_blue' | 'dark_purple' | 'light_purple' | string | never;
    bold?: boolean | never;
    italic?: boolean | never;
    underlined?: boolean | never;
    strikethrough?: boolean | never;
    obfuscated?: boolean | never;
    extra?: TextComponent[] | never;
}