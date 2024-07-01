import { Context } from 'grammy';
import { ChatCompletion } from 'openai/resources';
import supabase from '../config/supabase';
import { Excercise, ExerciseForUpload } from '../types';

export function prepare_exercises_for_upload(
  exercises: Array<Excercise>,
  workout_id: number,
): Array<ExerciseForUpload> {
  return exercises.map((e) => ({
    name: e.name,
    weight: e.weight,
    reps: e.reps,
    sets: e.sets,
    distance: e.distance,
    duration: e.duration,
    distance_units: 'miles',
    duration_units: 'minutes',
    weight_units: 'lbs',
    workout_id,
  }));
}

export function extract_openai_completion_message(
  completion: ChatCompletion,
): string {
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

export function extract_message_text(ctx: Context) {
  return ctx.msg?.text;
}

export function extract_message_and_chat_id(ctx: Context) {
  return {
    message: extract_message_text(ctx),
    telegram_chat_id: extract_telegram_chat_id(ctx),
  };
}

export function extract_telegram_chat_id(ctx: Context) {
  return ctx.chat?.id.toString();
}

export async function is_valid_token_and_chat_id(
  ctx: Context,
): Promise<boolean> {
  const chatId = ctx.chat?.id;
  if (!chatId) return false;
  const { data, error } = await supabase
    .from('user_token')
    .select('token, telegram_chat_id')
    .eq('telegram_chat_id', chatId);

  return true;
}
