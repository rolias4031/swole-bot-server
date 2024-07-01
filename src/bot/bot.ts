import { Bot, Context, session, SessionFlavor } from 'grammy';
import {
  extract_openai_completion_message,
  extract_message_and_chat_id,
  extract_message_text,
  extract_telegram_chat_id,
  prepare_exercises_for_upload,
} from '../util/util';
import {
  convert_raw_workouts_to_json,
  is_valid_user,
  link_token_to_chat_id,
} from './bot_controllers';
import {
  is_negative_answer,
  prepare_workout_data,
  TRIAGE_OPTIONS,
  triage_user_message,
  validate_json_and_convert_to_object,
} from '../util/openai';
import {
  Conversation,
  ConversationFlavor,
  conversations,
  createConversation,
} from '@grammyjs/conversations';
import supabase from '../config/supabase';
import { Database } from '../types/database.types';
import { Excercise } from '../types';
import { create_workout, get_user_id_from_chat_id } from '../util/supabase';

interface WorkoutDataFromJSON {
  exercises: Array<Excercise>;
}

interface SessionData {}

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor;
export type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN || '');

function createInitialSessionData(): SessionData {
  return {};
}

bot.use(session({ initial: createInitialSessionData }));
bot.use(conversations());

async function upload_conversation(
  conversation: MyConversation,
  ctx: MyContext,
) {
  const raw_workouts: Array<string> = [ctx.msg?.text || ''];
  let flag = true;
  while (flag) {
    conversation.log(raw_workouts);
    await ctx.reply('Awesome! Any other exercises for this workout?');
    const user_answer = await conversation.wait();
    const message = extract_message_text(user_answer);
    conversation.log(message);
    if (!message) {
      return ctx.reply('Got it, uploading now.');
    }
    const completion = await is_negative_answer(message);
    const completion_text = extract_openai_completion_message(completion);
    conversation.log('completion_text', completion_text);
    if (completion_text === 'END') {
      flag = false;
      await ctx.reply('Got it, uploading now.');
    }
    raw_workouts.push(message);
  }

  const workout_json = await convert_raw_workouts_to_json(raw_workouts);
  const { valid, workout_object } =
    validate_json_and_convert_to_object(workout_json);
  conversation.log('VALID?', valid);
  if (!valid) {
    await ctx.reply('Something went wrong preparing your data.');
    return;
  }
  if (!workout_object || !('exercises' in workout_object)) {
    await ctx.reply('Something went wrong with extracting exercises');
    return;
  }
  const { exercises } = workout_object;
  console.log(exercises);
  // create a workout, get id.
  const telegram_chat_id = extract_telegram_chat_id(ctx) || '';
  const { get_user_id_data, get_user_id_error } =
    await get_user_id_from_chat_id(telegram_chat_id);
  if (!get_user_id_data) {
    return ctx.reply('could not find u as a user.');
  }
  const { create_workout_data, create_workout_error } = await create_workout(
    get_user_id_data.user_id,
  );
  if (!create_workout_data) {
    return ctx.reply('error creating workout');
  }
  console.log(create_workout_data);
  // create exercises and associate them with workout

  const exercises_for_upload = prepare_exercises_for_upload(
    exercises,
    create_workout_data.id,
  );
  const { data: insert_exercise_data, error: insert_exercise_error } =
    await supabase.from('exercise').insert(exercises_for_upload).select();

  if (insert_exercise_error) {
    console.log(insert_exercise_error);
    await ctx.reply('upload error');
  }
  console.log('INSERT', insert_exercise_data);
  ctx.reply('Finished');
}

async function fetch_conversation() {}

bot.use(createConversation(upload_conversation));

bot.command('link', link_token_to_chat_id);

bot.on('message', async (ctx: MyContext) => {
  const { message, telegram_chat_id } = extract_message_and_chat_id(ctx);
  if (!is_valid_user(telegram_chat_id)) {
    ctx.reply(
      "Invalid user. Either your token is invalid or you haven't linked it to this chat.",
    );
  }
  if (!message) {
    return ctx.reply('I did not get a message.');
  }
  const completion = await triage_user_message(message);
  const completion_content = extract_openai_completion_message(completion);
  ctx.reply(completion_content);
  // actions for TRIAGE_OPTIONS, maybe a switch/case
  if (completion_content === TRIAGE_OPTIONS.UPLOAD) {
    await ctx.conversation.enter('upload_conversation');
  }
  if (completion_content === TRIAGE_OPTIONS.ANSWER) {
    const { data, error } = await supabase
      .from('workout')
      .select('created_at, exercise (id)');
    if (!data || error) {
      console.log(error);
      return;
    }
    console.log(data);
  }
});

bot.start();

export default bot;
