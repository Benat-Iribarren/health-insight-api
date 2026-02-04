import { supabaseClient } from '../supabaseClient';
import { randomUUID } from 'node:crypto';
import { ClinicalIntelligenceContext, generateUniqueEmail } from './types';

export async function seedClinicalIntelligenceContext(): Promise<ClinicalIntelligenceContext> {
  const overdueUserId = randomUUID();
  const healthyUserId = randomUUID();
  const overdueEmail = generateUniqueEmail('overdue');
  const healthyEmail = generateUniqueEmail('healthy');

  const { data: pData, error: pErr } = await supabaseClient
    .from('Patient')
    .insert([
      {
        name: 'Overdue',
        surname: 'Patient',
        email: overdueEmail,
        phone: '111',
        birth_date: '1990-01-01',
        gender: 'M',
        username: `overdue_${Math.floor(Math.random() * 9999)}`,
        user_id: overdueUserId,
      },
      {
        name: 'Healthy',
        surname: 'Patient',
        email: healthyEmail,
        phone: '222',
        birth_date: '1990-01-01',
        gender: 'F',
        username: `healthy_${Math.floor(Math.random() * 9999)}`,
        user_id: healthyUserId,
      },
    ])
    .select();

  const { data: sData, error: sErr } = await supabaseClient
    .from('Session')
    .insert([{ number: 1, day_offset: 1 }])
    .select();

  if (pErr || sErr || !pData || !sData) throw new Error('Fallo Seed Clinical Intelligence');

  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 15);

  await supabaseClient.from('PatientSession').insert([
    {
      session_id: sData[0].id,
      patient_id: pData[0].id,
      state: 'assigned',
      assigned_date: overdueDate.toISOString(),
      pre_evaluation: 0,
      post_evaluation: 0,
    },
    {
      session_id: sData[0].id,
      patient_id: pData[1].id,
      state: 'completed',
      assigned_date: new Date().toISOString(),
      pre_evaluation: 5,
      post_evaluation: 8,
    },
  ]);

  return {
    patientIdOverdue: pData[0].id,
    patientIdHealthy: pData[1].id,
    patientUserIdOverdue: overdueUserId,
    patientUserIdHealthy: healthyUserId,
    sessionId: sData[0].id,
    emailOverdue: overdueEmail,
    emailHealthy: healthyEmail,
  };
}

export const initClinicalIntelligenceTestDatabase = seedClinicalIntelligenceContext;
