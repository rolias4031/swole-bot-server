import { Context } from 'grammy';
import supabase from '../config/supabase';

export async function link_token_to_chat_id(ctx: Context) {
  const token = ctx.match;
  const telegram_chat_id = ctx.chat?.id.toString();

  // typecheck token and telegram_chat_id
  if (!token || typeof token !== 'string') {
    return ctx.reply('Missing token. Add it like so: /link your_token.');
  }
  if (!telegram_chat_id) {
    return ctx.reply('Missing Telegram Chat Id.');
  }

  // fetch token, validate token
  const { data: user_token_data, error: user_token_error } = await supabase
    .from('user_token')
    .select('token, telegram_chat_id')
    .eq('token', token);

  if (!user_token_data) {
    return ctx.reply("The token you submitted doesn't exist");
  }
  const has_telegram_chat_id = !!user_token_data[0].telegram_chat_id;
  if (has_telegram_chat_id) {
    return ctx.reply('This token is already linked.');
  }

  // proceed with linking token to telegram_chat_id
  const { data, error } = await supabase
    .from('user_token')
    .update({
      telegram_chat_id,
    })
    .eq('token', token);

  if (error && !data) {
    return ctx.reply(`Something went wrong: ${error.message}`)
  }

  return ctx.reply("You're linked. You can now use Growth Mate.")
  
}
