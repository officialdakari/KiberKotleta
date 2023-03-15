import { Bot } from "mineflayer";



async function goToSleep(bot: Bot) {
    const bed = bot.findBlock({
        matching: block => bot.isABed(block)
    })
    if (bed) {
        try {
            await bot.sleep(bed);
            bot.chat("Я сплю");
        } catch (err) {
            bot.chat(`бессоница: ${err.message}`);
        }
    } else {
        bot.chat('Кроватки нет(');
    }
}

async function wakeUp(bot: Bot) {
    try {
        await bot.wake();
    } catch (err) {
        bot.chat(`спать ещё хочу: ${err.message}`);
    }
}

export default async function sleeper(bot: Bot) {
    bot.on('sleep', () => {
        bot.chat('Good night!')
    });

    bot.on('wake', () => {
        bot.chat('Good morning!')
    });

    bot.on('time', async () => {
        if (!bot.time.isDay) {
            await goToSleep(bot);
        }
    });
}