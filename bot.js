import { Telegraf } from "telegraf";
import { supabase } from "./supabase";

const {data, error} = await supabase.from('botData').select('botToken')

const token = data.botToken;
let bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Welcome'))

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))