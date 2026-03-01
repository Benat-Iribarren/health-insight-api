import { MetricSummary } from '../logic/calculateMetrics';
import { BiometricSample } from './BiometricSample';

export type UnifiedSessionReport = {
    sessionId: string;
    state: string;
    dizzinessPercentage: number;
    noBiometrics?: true;
    subjectiveAnalysis: { preEvaluation: number; postEvaluation: number; delta: number };
    objectiveAnalysis: { summary: MetricSummary | Record<string, never>; biometricDetails: BiometricSample[] };
};