import { supabaseClient } from '../supabaseClient';
import { randomUUID } from 'node:crypto';
import { BiometricsContext, generateUniqueEmail } from './types';

export async function seedBiometricsContext(): Promise<BiometricsContext> {
  const userId = randomUUID();
  const email = generateUniqueEmail('bio');

  const { data: patient } = await supabaseClient
    .from('Patient')
    .insert([
      {
        user_id: userId,
        name: 'Biometrics',
        surname: 'Test',
        email: email,
        phone: '123456789',
        birth_date: '1990-01-01',
        gender: 'M',
        username: `user_${userId.slice(0, 8)}`,
      },
    ])
    .select()
    .single();

  const { data: session } = await supabaseClient
    .from('Session')
    .insert([
      {
        number: 1,
        day_offset: 0,
      },
    ])
    .select()
    .single();

  const now = new Date();
  now.setUTCSeconds(0, 0);
  const startIso = new Date(now.getTime() - 600000).toISOString();
  const endIso = now.toISOString();

  const { data: ps } = await supabaseClient
    .from('PatientSession')
    .insert([
      {
        session_id: session!.id,
        patient_id: patient!.id,
        state: 'completed',
        assigned_date: startIso,
        pre_evaluation: 2,
        post_evaluation: 6,
      },
    ])
    .select()
    .single();

  const { data: contextInterval } = await supabaseClient
    .from('ContextIntervals')
    .insert([
      {
        patient_id: patient!.id,
        session_id: ps!.id,
        context_type: 'session',
        start_minute_utc: startIso,
        end_minute_utc: endIso,
      },
    ])
    .select()
    .single();

  return {
    patientId: patient!.id,
    patientUserId: userId,
    patientSessionId: ps!.id,
    sessionId: session!.id,
    contextIntervalId: contextInterval!.id,
    startTime: startIso,
    endTime: endIso,
    email: email,
  };
}

export const initBiometricsTestDatabase = seedBiometricsContext;
