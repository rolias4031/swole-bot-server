import { Request, Response } from 'express';
import bot from '../bot/bot';
import supabase from '../config/supabase';

export function status_check(req: Request, res: Response) {
  res.json({ message: 'Operational' });
}

export async function ping(req: Request, res: Response) {
  await bot.api.sendMessage(process.env.CHAT_ID || '', 'ping');
  res.json({ message: 'Success' });
}

export async function mint_user_token(req: Request, res: Response) {
  const user_id = req.body.user_id;
  console.log(req.body);
  if (!user_id) return res.json({ message: 'failure' });
  const { data, error } = await supabase.from('user_token').insert({
    user_id: user_id,
  });
  console.log(data);
  return res.json({ message: 'success' });
}
