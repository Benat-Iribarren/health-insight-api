export interface DropoutRisk {
    patientId: string;
    name: string;
    riskScore: number;
    status: 'CRITICAL' | 'MODERATE' | 'LOW';
    bufferDays: number;
    factors: string[];
}