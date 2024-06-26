import { Bot, Context, GrammyError, HttpError } from 'grammy';
import { extract_completion_message } from '../util/util';
import { openai } from '../config/openai_config';
import supabase from '../config/supabase';
import { link_token_to_chat_id } from './bot_controllers';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');

bot.command('link', link_token_to_chat_id);

bot.on('message', async (ctx: Context) => {
  const { data, error, status } = await supabase
    .from('workout')
    .select('created_at, exercises');
  if (!data || !Array.isArray(data)) {
    console.log(data);
    reply_to_general_message(ctx);
    return;
  }
  console.log(data[0].exercises);
  console.log(data, error, status);
  reply_to_general_message(ctx);
});

bot.start();

async function reply_to_general_message(ctx: Context) {
  console.log('///');
  console.log({ ctx }, ctx.message);
  console.log('id', ctx.chat?.id);
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `You're a friendly bot that helps people stay accountable with their goals. Reply accordingly`,
      },
    ],
    model: 'gpt-3.5-turbo',
  });
  console.log({ completion });
  const messageContent = extract_completion_message(completion);
  ctx.reply(messageContent);
}

export default bot;
