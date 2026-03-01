export type DropoutStatus = 'CRITICAL' | 'MODERATE' | 'LOW';

export interface DropoutRisk {
    patientId: number;
    name: string;
    riskScore: number;
    status: DropoutStatus;
    bufferDays: number;
    factors: string[];
}