import { randomUUID } from 'node:crypto';

export interface MasterSeedContext {
  sessionsCreated: number[];
  questionsCreated: number[];
  isInitialized: boolean;
}

export interface MessagingContext {
  patientId: number;
  patientUserId: string;
  notificationId: string;
  sessionId: number;
  email: string;
}

export interface BiometricsContext {
  patientId: number;
  patientUserId: string;
  patientSessionId: number;
  sessionId: number;
  contextIntervalId: number;
  startTime: string;
  endTime: string;
  email: string;
}

export interface ClinicalIntelligenceContext {
  patientIdOverdue: number;
  patientIdHealthy: number;
  patientUserIdOverdue: string;
  patientUserIdHealthy: string;
  sessionId: number;
  emailOverdue: string;
  emailHealthy: string;
}

export interface TeardownConfig {
  preserveMasterData?: boolean;
  cascadeDelete?: boolean;
}

export function generateUniqueEmail(prefix: string): string {
  return `${prefix}-${Math.floor(Math.random() * 999999)}@competition.com`;
}

export function generateUniqueUserId(): string {
  return randomUUID();
}
