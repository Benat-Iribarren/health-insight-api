import { supabaseClient } from '../supabaseClient';
import { MasterSeedContext } from './types';

let masterContext: MasterSeedContext | null = null;

export async function initMasterDatabase(): Promise<MasterSeedContext> {
  if (masterContext?.isInitialized) {
    return masterContext;
  }

  const existingSessions = await supabaseClient
    .from('Session')
    .select('id')
    .order('id', { ascending: true });

  const sessionIds: number[] = [];

  if (!existingSessions.data || existingSessions.data.length === 0) {
    const { data: sessions } = await supabaseClient
      .from('Session')
      .insert([
        { number: 1, day_offset: 0, duration: 3600 },
        { number: 2, day_offset: 1, duration: 3600 },
        { number: 3, day_offset: 2, duration: 3600 },
      ])
      .select('id');

    if (sessions) {
      sessionIds.push(...sessions.map((s) => s.id));
    }
  } else {
    sessionIds.push(...existingSessions.data.map((s) => s.id));
  }

  const existingQuestions = await supabaseClient
    .from('Question')
    .select('id')
    .order('id', { ascending: true });

  const questionIds: number[] = [];

  if (!existingQuestions.data || existingQuestions.data.length === 0) {
    const questionsToInsert = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

    const { data: questions } = await supabaseClient
      .from('Question')
      .insert(questionsToInsert)
      .select('id');

    if (questions) {
      questionIds.push(...questions.map((q) => q.id));
    }
  } else {
    questionIds.push(...existingQuestions.data.map((q) => q.id));
  }

  masterContext = {
    sessionsCreated: sessionIds,
    questionsCreated: questionIds,
    isInitialized: true,
  };

  return masterContext;
}

export function getMasterContext(): MasterSeedContext | null {
  return masterContext;
}

export function resetMasterContext(): void {
  masterContext = null;
}
