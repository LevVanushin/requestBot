import { Telegraf } from "telegraf";
import { supabase } from "./supabase.js";

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error('❌ BOT_TOKEN не найден в переменных окружения');
    process.exit(1);
}

const bot = new Telegraf(token);

// Команда /start
bot.start((ctx) => ctx.reply('👋 Добро пожаловать! Используйте /check для просмотра заявок'));

// Команда /check - вывод всех заявок
bot.command('check', async (ctx) => {
    try {
        // Показываем, что бот обрабатывает запрос
        ctx.reply('🔍 Получаю список заявок...');
        
        // Получаем данные из базы данных
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            ;
        
        if (error) {
            console.error('Ошибка Supabase:', error);
            await ctx.reply('❌ Ошибка при получении данных из базы данных');
            return;
        }
        
        // Проверяем, есть ли заявки
        if (!data || data.length === 0) {
            await ctx.reply('📭 Нет ни одной заявки в базе данных');
            return;
        }
        
        // Формируем сообщение со всеми заявками
        let message = `📋 *Список заявок (${data.length} шт.):*\n\n`;
        
        data.forEach((request, index) => {
            // Парсим данные из поля data (JSON строка)
            let formData = {};
            try {
                formData = JSON.parse(request.data);
            } catch (e) {
                formData = { error: "Не удалось распарсить данные" };
            }
            
            // Форматируем дату
            const date = new Date(request.created_at);
            const formattedDate = date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Добавляем заявку в сообщение
            message += `*${index + 1}. Заявка #${request.id}*\n`;
            message += `📅 *Дата:* ${formattedDate}\n`;
            message += `👤 *Имя:* ${formData.name || 'Не указано'}\n`;
            message += `📧 *Email:* ${formData.email || 'Не указан'}\n`;
            message += `💼 *Услуга:* ${formData.service || 'Не указана'}\n`;
            message += `💬 *Сообщение:* ${formData.message || 'Нет сообщения'}\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        });
        
        // Отправляем сообщение (если оно слишком длинное, Telegram может не отправить)
        if (message.length > 4096) {
            // Разбиваем на части
            const chunks = message.match(/[\s\S]{1,4000}/g) || [];
            for (const chunk of chunks) {
                await ctx.reply(chunk, { parse_mode: 'Markdown' });
            }
        } else {
            await ctx.reply(message, { parse_mode: 'Markdown' });
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        await ctx.reply('❌ Произошла ошибка при обработке запроса');
    }
});

// Команда /check N - показать последние N заявок
bot.command('check', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const limit = args[1] ? parseInt(args[1]) : null;
    
    try {
        let query = supabase
            .from('requests')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (limit && !isNaN(limit)) {
            query = query.limit(limit);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            await ctx.reply('📭 Нет заявок');
            return;
        }
        
        let message = `📋 *Последние ${data.length} заявок:*\n\n`;
        
        data.forEach((request, index) => {
            let formData = JSON.parse(request.data || '{}');
            message += `*${index + 1}. ${formData.name || 'Без имени'}*\n`;
            message += `📧 ${formData.email || 'Нет email'}\n`;
            message += `💼 ${formData.service || 'Нет услуги'}\n`;
            message += `━━━━━━━━━━━━━━━\n`;
        });
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
        
    } catch (error) {
        await ctx.reply('❌ Ошибка получения данных');
    }
});

// Команда /details ID - показать детальную информацию о заявке
bot.command('details', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const requestId = args[1];
    
    if (!requestId) {
        await ctx.reply('⚠️ Укажите ID заявки. Пример: /details 1');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .eq('id', requestId)
            .single();
        
        if (error || !data) {
            await ctx.reply('❌ Заявка не найдена');
            return;
        }
        
        let formData = JSON.parse(data.data || '{}');
        
        const message = `
📋 *ДЕТАЛЬНАЯ ИНФОРМАЦИЯ О ЗАЯВКЕ*

🆔 *ID:* ${data.id}
📅 *Создано:* ${new Date(data.created_at).toLocaleString('ru-RU')}

👤 *Имя:* ${formData.name || 'Не указано'}
📧 *Email:* ${formData.email || 'Не указан'}
💼 *Услуга:* ${formData.service || 'Не указана'}
💬 *Сообщение:* 
${formData.message || 'Нет сообщения'}

📊 *Статус:* ${data.status || 'pending'}
        `;
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
        
    } catch (error) {
        await ctx.reply('❌ Ошибка получения деталей заявки');
    }
});

// Команда /count - показать количество заявок
bot.command('count', async (ctx) => {
    try {
        const { count, error } = await supabase
            .from('requests')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        await ctx.reply(`📊 Всего заявок в базе данных: *${count}*`, { parse_mode: 'Markdown' });
        
    } catch (error) {
        await ctx.reply('❌ Ошибка подсчета заявок');
    }
});

// Команда /help
bot.command('help', (ctx) => {
    const helpMessage = `
🤖 *Доступные команды:*

/check - Показать все заявки
/check 5 - Показать последние 5 заявок
/details [ID] - Показать детали заявки по ID
/count - Показать количество заявок
/help - Показать это сообщение

*Примеры:*
/check
/check 3
/details 1
    `;
    
    ctx.reply(helpMessage, { parse_mode: 'Markdown' });
});

// Запуск бота
bot.launch()
    .then(() => {
        console.log('✅ Бот успешно запущен');
        console.log('Доступные команды: /check, /details, /count, /help');
    })
    .catch((err) => {
        console.error('❌ Ошибка при запуске бота:', err);
        process.exit(1);
    });

// Graceful stop
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    console.log('Бот остановлен');
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    console.log('Бот остановлен');
});