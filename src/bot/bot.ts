import { Bot, Context, session, SessionFlavor } from 'grammy';
import {
  extract_completion_message,
  extract_message_and_chat_id,
  extract_message_text,
} from '../util/util';
import { is_valid_user, link_token_to_chat_id } from './bot_controllers';
import {
  is_negative_answer,
  TRIAGE_OPTIONS,
  triage_user_message,
} from '../util/openai';
import {
  Conversation,
  ConversationFlavor,
  conversations,
  createConversation,
} from '@grammyjs/conversations';

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
  const workouts: Array<string> = [ctx.msg?.text || ''];
  let flag = true;
  while (flag) {
    conversation.log(workouts);
    await ctx.reply('Awesome! Any other exercises for this workout?');
    const user_answer = await conversation.wait();
    const message = extract_message_text(user_answer);
    conversation.log(message);
    if (!message) {
      return ctx.reply('Got it, uploading now.');
    }
    const completion = await is_negative_answer(message);
    const completion_text = extract_completion_message(completion);
    conversation.log('completion_text', completion_text);
    if (completion_text === 'END') {
      return await ctx.reply('Got it, uploading now.');
    }
    workouts.push(message);
  }
}

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
  const completion_content = extract_completion_message(completion);
  ctx.reply(completion_content);
  // actions for TRIAGE_OPTIONS, maybe a switch/case
  if (completion_content === TRIAGE_OPTIONS.UPLOAD) {
    await ctx.conversation.enter('upload_conversation');
  }
});

bot.start();

export default bot;
