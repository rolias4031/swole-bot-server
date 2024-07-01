import { Context } from 'grammy';
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from '@grammyjs/conversations';
import supabase from '../config/supabase';
import { MyContext } from './bot';
import { prepare_workout_data } from '../util/openai';
import { extract_openai_completion_message } from '../util/util';

export async function link_token_to_chat_id(ctx: MyContext) {
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
    .select('token, telegram_chat_id, is_valid')
    .eq('token', token)
    .limit(1)
    .single();

  if (user_token_error) {
    return ctx.reply('Invalid token or database error.');
  }
  if (user_token_data.telegram_chat_id || !user_token_data.is_valid) {
    return ctx.reply('This token is already linked or is invalid.');
  }

  // proceed with linking token to telegram_chat_id
  const { error } = await supabase
    .from('user_token')
    .update({
      telegram_chat_id,
    })
    .eq('token', token);

  if (error) {
    return ctx.reply(`Something went wrong linking your token.`);
  }

  return ctx.reply("You're linked. You can now use Growth Mate.");
}

export async function is_valid_user(
  telegram_chat_id: string | undefined,
): Promise<boolean> {
  if (!telegram_chat_id) return false;

  const { data: user_token, error } = await supabase
    .from('user_token')
    .select('token, telegram_chat_id, is_valid')
    .eq('telegram_chat_id', telegram_chat_id)
    .limit(1)
    .single();

  if (!user_token || !user_token.token || !user_token.is_valid || error) {
    return false;
  }

  return true;
}

export async function convert_raw_workouts_to_json(workouts: Array<string>) {
  const json_completion = await prepare_workout_data(workouts);
  const json_completion_text =
    extract_openai_completion_message(json_completion);
  return json_completion_text;
}
