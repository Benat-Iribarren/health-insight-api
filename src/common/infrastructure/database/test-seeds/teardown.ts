import { supabaseClient } from '../supabaseClient';
import {
  MessagingContext,
  BiometricsContext,
  ClinicalIntelligenceContext,
  TeardownConfig,
} from './types';

export async function teardownPatientData(
  patientId: number,
  config: TeardownConfig = {},
): Promise<void> {
  const { cascadeDelete = true } = config;

  try {
    if (cascadeDelete) {
      await supabaseClient.from('BiometricMinutes').delete().eq('patient_id', patientId);

      await supabaseClient.from('ContextIntervals').delete().eq('patient_id', patientId);

      await supabaseClient.from('Notifications').delete().eq('patient_id', patientId);

      await supabaseClient.from('SecurityLogs').delete().eq('patient_id', patientId);
    }

    await supabaseClient.from('PatientSession').delete().eq('patient_id', patientId);

    await supabaseClient.from('Patient').delete().eq('id', patientId);
  } catch (error) {
    console.error(`Error during teardown for patient ${patientId}:`, error);
    throw error;
  }
}

export async function teardownMessagingContext(context: MessagingContext): Promise<void> {
  await teardownPatientData(context.patientId, { cascadeDelete: true });
}

export async function teardownBiometricsContext(context: BiometricsContext): Promise<void> {
  await teardownPatientData(context.patientId, { cascadeDelete: true });
}

export async function teardownClinicalIntelligenceContext(
  context: ClinicalIntelligenceContext,
): Promise<void> {
  await Promise.all([
    teardownPatientData(context.patientIdOverdue, { cascadeDelete: true }),
    teardownPatientData(context.patientIdHealthy, { cascadeDelete: true }),
  ]);
}

export async function teardownMultiplePatients(patientIds: number[]): Promise<void> {
  await Promise.all(
    patientIds.map((patientId) => teardownPatientData(patientId, { cascadeDelete: true })),
  );
}
