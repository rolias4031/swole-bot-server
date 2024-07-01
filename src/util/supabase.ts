import supabase from '../config/supabase';

export async function get_user_id_from_chat_id(telegram_chat_id: string) {
  const query = await supabase
    .from('user_token')
    .select('user_id')
    .limit(1)
    .eq('telegram_chat_id', telegram_chat_id || '')
    .single();

  return { get_user_id_data: query.data, get_user_id_error: query.error };
}

export async function create_workout(user_id: string) {
  const result = await supabase
    .from('workout')
    .insert({
      user_id: user_id,
    })
    .select('id')
    .limit(1)
    .single();

  return {
    create_workout_data: result.data,
    create_workout_error: result.error,
  };
}
