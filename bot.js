import { Telegraf } from "telegraf";
import { supabase } from "./supabase.js";

const {data, error} = await supabase.from('botData').select('*')

const token = data[0].botToken;
let bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Welcome'))

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))