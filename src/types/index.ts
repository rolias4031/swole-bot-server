import { Database } from './database.types';

type ExerciseRow = Database['public']['Tables']['exercise']['Row'];
export type ExerciseForUpload = Omit<ExerciseRow, 'created_at' | 'id'>;

export interface Excercise {
  name: string;
  weight: number | null;
  reps: number | null;
  sets: number | null;
  distance: number | null;
  duration: number | null;
}
