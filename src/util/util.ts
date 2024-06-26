import { Context } from 'grammy';
import { ChatCompletion } from 'openai/resources';
import supabase from '../config/supabase';

export function extract_completion_message(completion: ChatCompletion): string {
  if (
    completion.choices &&
    completion.choices.length > 0 &&
    completion.choices[0].message &&
    typeof completion.choices[0].message.content === 'string'
  ) {
    return completion.choices[0].message.content;
  }
  throw new Error('Invalid completion structure or content is not a string');
}

export async function is_valid_token_and_chat_id(ctx: Context): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (!chatId) return false;
  const { data, error } = await supabase
    .from('user_token')
    .select('token, telegram_chat_id')
    .eq('telegram_chat_id', chatId);

  return true;
}
