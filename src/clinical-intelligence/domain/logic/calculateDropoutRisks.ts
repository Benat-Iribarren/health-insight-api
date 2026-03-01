import { DropoutRisk, DropoutStatus } from '../models/DropoutRisk';
import { PatientSessionData } from '../models/PatientSessionData';

type PatientSessions = Map<number, { name: string; sessions: PatientSessionData[] }>;

export function calculateDropoutRisks(data: PatientSessionData[], now: Date = new Date()): DropoutRisk[] {
    const patientsMap = groupSessionsByPatient(data);

    const results: DropoutRisk[] = Array.from(patientsMap.entries()).map(([patientId, p]) => {
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
            bufferDays = Math.ceil((assignedDate.getTime() - now.getTime()) / 86_400_000);

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

        const status: DropoutStatus = clamped > 70 ? 'CRITICAL' : clamped > 40 ? 'MODERATE' : 'LOW';

        return { patientId, name: p.name, riskScore: clamped, status, bufferDays, factors };
    });

    return results.sort((a, b) => b.riskScore - a.riskScore);
}

function groupSessionsByPatient(data: PatientSessionData[]): PatientSessions {
    const patientsMap: PatientSessions = new Map();

    for (const row of data) {
        const id = Number(row.patientId);
        const current = patientsMap.get(id);

        if (!current) {
            patientsMap.set(id, { name: row.name, sessions: [row] });
            continue;
        }

        current.sessions.push(row);
    }

    return patientsMap;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}