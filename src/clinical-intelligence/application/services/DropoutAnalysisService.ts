import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { DropoutRisk } from '../../domain/models/DropoutRisk';
import { PatientSessionData } from '../../domain/models/PatientSessionData';
import { analysisFailedError, noDataError, PredictDropoutError } from '../types/PredictDropoutError';

type PatientSessions = Map<string, { name: string; sessions: PatientSessionData[] }>;

export async function processDropoutAnalysisService(
    repository: DropoutRepository,
    patientId?: number
): Promise<DropoutRisk[] | PredictDropoutError> {
    try {
        const data = await repository.getPatientSessionData(patientId);

        if (!data || data.length === 0) {
            return noDataError;
        }

        const patientsMap = groupSessionsByPatient(data);
        const results = calculateDropoutRisks(patientsMap);

        return results.sort((a, b) => b.riskScore - a.riskScore);
    } catch {
        return analysisFailedError;
    }
}

function groupSessionsByPatient(data: PatientSessionData[]): PatientSessions {
    const patientsMap: PatientSessions = new Map();

    for (const row of data) {
        const id = String(row.patientId);
        const current = patientsMap.get(id);

        if (!current) {
            patientsMap.set(id, { name: row.name, sessions: [row] });
            continue;
        }

        current.sessions.push(row);
    }

    return patientsMap;
}

function calculateDropoutRisks(patientsMap: PatientSessions): DropoutRisk[] {
    const now = new Date();

    return Array.from(patientsMap.entries()).map(([id, p]) => {
        const sessions = [...p.sessions].sort(
            (a, b) => new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()
        );

        const nextSession = sessions.find((s) => s.sessionStatus !== 'completed');
        const lastCompleted = [...sessions].reverse().find((s) => s.sessionStatus === 'completed');

        let riskScore = 0;
        const factors: string[] = [];

        let bufferDays = 0;

        if (nextSession) {
            const assignedDate = new Date(nextSession.assignedDate);
            bufferDays = Math.ceil((assignedDate.getTime() - now.getTime()) / 86400000);

            if (bufferDays < 0) {
                riskScore += 50;
                factors.push('Retraso en calendario');
            } else if (bufferDays > 7) {
                riskScore -= 30;
            }
        }

        if (lastCompleted && lastCompleted.postEval > 7) {
            riskScore += 20;
            factors.push('Mareo elevado en ultima sesion');
        }

        const clamped = clamp(riskScore, 0, 100);

        return {
            patientId: id,
            name: p.name,
            riskScore: clamped,
            status: clamped > 70 ? 'CRITICAL' : clamped > 40 ? 'MODERATE' : 'LOW',
            bufferDays,
            factors,
        };
    });
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
