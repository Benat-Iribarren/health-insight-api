import { DropoutRisk, DropoutStatus } from '../models/DropoutRisk';
import { PatientSessionData } from '../models/PatientSessionData';

const MS_PER_DAY = 86_400_000;
const INACTIVITY_DAYS_THRESHOLD = 7;

type PatientSessions = Map<number, { name: string; sessions: PatientSessionData[] }>;

export function calculateDropoutRisks(
    data: PatientSessionData[],
    now: Date = new Date(),
): DropoutRisk[] {
    const patientsMap = groupSessionsByPatient(data);

    const results: DropoutRisk[] = Array.from(patientsMap.entries()).map(
        ([patientId, p]) => {
            const sessions = [...p.sessions].sort(
                (a, b) => getDateTime(a.assignedDate) - getDateTime(b.assignedDate),
            );

            const lastCompleted = [...sessions]
                .reverse()
                .find((s) => s.sessionStatus === 'completed');

            let riskScore = 0;
            const factors: string[] = [];
            let bufferDays = 0;

            if (lastCompleted?.completedDate) {
                bufferDays = Math.floor(
                    (startOfDay(now).getTime() -
                        startOfDay(new Date(lastCompleted.completedDate)).getTime()) /
                    MS_PER_DAY,
                );

                if (bufferDays > INACTIVITY_DAYS_THRESHOLD) {
                    riskScore += 50;
                    factors.push('Periodo de inactividad prolongado');
                }
            }

            if (lastCompleted && lastCompleted.postEval > 7) {
                riskScore += 20;
                factors.push('Estrés elevado en la última sesión');
            }

            const clamped = clamp(riskScore, 0, 100);

            const status: DropoutStatus =
                clamped >= 70 ? 'CRITICAL' : clamped >= 40 ? 'MODERATE' : 'LOW';

            return {
                patientId,
                name: p.name,
                riskScore: clamped,
                status,
                bufferDays,
                factors,
            };
        },
    );

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

function getDateTime(value: string | null): number {
    if (!value) return 0;
    return new Date(value).getTime();
}

function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}