import { ChatCompletionMessageParam } from 'openai/resources';
import { openai } from '../config/openai';
import { Excercise } from '../types';

export const TRIAGE_OPTIONS = {
  UPLOAD: 'UPLOAD',
  ANSWER: 'ANSWER',
  NONE: 'NONE',
};

const TRIAGE_USER_MESSAGE_CONTEXT: Array<ChatCompletionMessageParam> = [
  {
    role: 'system',
    content: `You are a bot responsible for determining whether a message has workout data, or if it has a question about their workout data. If it has data, respond with "${TRIAGE_OPTIONS.UPLOAD}". If it has a question about data, respond with "${TRIAGE_OPTIONS.ANSWER}". If it has neither, respond with "${TRIAGE_OPTIONS.NONE}".`,
  },
  {
    role: 'user',
    content: 'bench press - 150, squat - 220, run - 2 miles.',
  },
  { role: 'assistant', content: TRIAGE_OPTIONS.UPLOAD },
  {
    role: 'user',
    content: 'cycle 25 miles, curls 50lbs, yoga.',
  },
  { role: 'assistant', content: TRIAGE_OPTIONS.UPLOAD },
  {
    role: 'user',
    content:
      'upload this data: lunges 200, run 5 minutes, planks, and more abs.',
  },
  { role: 'assistant', content: TRIAGE_OPTIONS.UPLOAD },
  { role: 'user', content: 'What was my maximum bench press last week?' },
  { role: 'assistant', content: TRIAGE_OPTIONS.ANSWER },
  { role: 'user', content: 'Tell me how much my running has improved' },
  { role: 'assistant', content: TRIAGE_OPTIONS.ANSWER },
  { role: 'user', content: 'At what point last week did I workout hardest' },
  { role: 'assistant', content: TRIAGE_OPTIONS.ANSWER },
  { role: 'user', content: 'What year is it, and who is the president?' },
  { role: 'assistant', content: TRIAGE_OPTIONS.NONE },
  { role: 'user', content: 'oanrvlkma' },
  { role: 'assistant', content: TRIAGE_OPTIONS.NONE },
  { role: 'user', content: 'link my token' },
  { role: 'assistant', content: TRIAGE_OPTIONS.NONE },
  { role: 'user', content: 'upload my workout data' },
  { role: 'assistant', content: TRIAGE_OPTIONS.NONE },
  { role: 'user', content: 'Why do squirrels jump high?' },
  { role: 'assistant', content: TRIAGE_OPTIONS.NONE },
];

const IS_NEGATIVE_ANSWER_CONTEXT: Array<ChatCompletionMessageParam> = [
  {
    role: 'system',
    content: `If the response you receive contains workout data, respond "CONTINUE". If it contains any other statement without workout data, respond "END".`,
  },
  { role: 'user', content: `No that's it` },
  { role: 'assistant', content: 'END' },
  { role: 'user', content: `No` },
  { role: 'assistant', content: 'END' },
  { role: 'user', content: `done` },
  { role: 'assistant', content: 'END' },
  { role: 'user', content: `finished adding` },
  { role: 'assistant', content: 'END' },
  {
    role: 'user',
    content: `Yes here's more workouts: bench press - 150, squats - 245`,
  },
  { role: 'assistant', content: 'CONTINUE' },
  { role: 'user', content: `run 2.5 miles, walk for 30 minutes` },
  { role: 'assistant', content: 'CONTINUE' },
  { role: 'user', content: `I also did curls for 20 lbs.` },
  { role: 'assistant', content: 'CONTINUE' },
];

const CONVERT_WORKOUTS_TO_JSON_CONTEXT: Array<ChatCompletionMessageParam> = [
  {
    role: 'system',
    content: `You're an intelligent bot that converts raw workout data into structured JSON. Please take the workout data I give you and convert it to JSON. Here is the shape the JSON should take:
    {
      "exercises": [
        {
          "name": "string",
          "weight": "number | null",
          "reps": "number | null",
          "sets": "number | null",
          "distance": "number | null",
          "duration": "number | null"
        }
      ]
    }

    All values are optional except name. If an exercise is missing properties, make them null.
    `,
  },
  {
    role: 'user',
    content:
      'bench press - 150 8 reps 4 sets, squats - 200 10 reps 5 sets, run 5 miles for 35 minutes',
  },
  {
    role: 'assistant',
    content: `{
      "exercises": [
        {
          "name": "bench press",
          "weight": 150,
          "reps": 8,
          "sets": 4,
          "distance": null,
          "duration": null
        },
        {
          "name": "squats",
          "weight": 200,
          "reps": 10,
          "sets": 5,
          "distance": null,
          "duration": null
        },
        {
          "name": "run",
          "weight": null,
          "reps": null,
          "sets": null,
          "distance": "5 miles",
          "duration": "35 minutes"
        }
      ]
    }`,
  },
];

export async function triage_user_message(message: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: TRIAGE_USER_MESSAGE_CONTEXT.concat({
      role: 'user',
      content: message,
    }),
  });
  console.log(completion.choices);
  return completion;
}

export async function is_negative_answer(message: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: IS_NEGATIVE_ANSWER_CONTEXT.concat({
      role: 'user',
      content: message,
    }),
  });
  return completion;
}

export async function prepare_workout_data(raw_workout_data: Array<string>) {
  const raw_workout_string = raw_workout_data.join();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: CONVERT_WORKOUTS_TO_JSON_CONTEXT.concat({
      role: 'user',
      content: raw_workout_string,
    }),
    response_format: {
      type: 'json_object',
    },
  });
  return completion;
}

export function validate_json_and_convert_to_object(json_data: string): {
  valid: boolean;
  workout_object: { exercises: Array<Excercise> } | null;
} {
  console.log(json_data);
  try {
    const workout_object = JSON.parse(json_data);
    return { valid: true, workout_object };
  } catch (error) {
    console.log(error);
    return { valid: false, workout_object: null };
  }
}
