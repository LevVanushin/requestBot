import { Telegraf } from "telegraf";
import { supabase } from "./supabase.js";


const token = process.env.BOT_TOKEN;
let bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Welcome'))

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))