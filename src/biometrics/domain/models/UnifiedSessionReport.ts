import { MetricSummary } from '../logic/calculateMetrics';

export type ReportBiometricDetail = {
    timestampIso: string;
    timestampUnixMs: number;
    pulseRateBpm: number | null;
    edaSclUsiemens: number | null;
    temperatureCelsius: number | null;
    accelStdG: number | null;
    respiratoryRateBrpm: number | null;
    bodyPositionType: string | null;
    phase?: 'pre' | 'session' | 'post';
};

export interface UnifiedSessionReport {
    sessionId: string;
    state: string;
    dizzinessPercentage: number;
    noBiometrics?: boolean;
    subjectiveAnalysis: {
        preEvaluation: number;
        postEvaluation: number;
        delta: number;
    };
    objectiveAnalysis: {
        summary: MetricSummary | Record<string, never>;
        biometricDetails: ReportBiometricDetail[];
    };
}