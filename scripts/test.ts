import { translateTextComponent } from "../util/textComponent";

(async () => {
    console.log(await translateTextComponent({
        text: 'Chat',
        extra: [
            {
                text: 'Player',
                color: 'red'
            },
            {
                text: ': ',
                color: 'gray'
            },
            {
                text: 'Hello everyone!',
                color: 'yellow'
            }
        ]
    }, "auto", "ru", ["Player"]));
    console.log(await translateTextComponent({
        text: '',
        extra: [
            {
                text: 'Player',
                color: 'red'
            },
            {
                text: ': ',
                color: 'gray'
            },
            {
                text: 'Hello everyone!',
                color: 'yellow'
            }
        ]
    }, "auto", "ru", ["Player"]));
    console.log(await translateTextComponent({ "extra": [{ "text": "\u003c" }, { "color": "gray", "text": "[" }, { "color": "aqua", "text": "Игрок" }, { "color": "gray", "text": "] " }, { "color": "green", "text": "DarkCoder153618" }, { "text": "\u003e" }, { "text": " Hello!" }], "text": "" }, "auto", "ru", ["Player"]));
})();