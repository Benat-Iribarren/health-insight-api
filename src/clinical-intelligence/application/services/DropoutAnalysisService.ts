import { DropoutRepository } from '../../domain/interfaces/DropoutRepository';
import { DropoutRisk } from '../../domain/models/DropoutRisk';
import { PatientSessionData } from '../../domain/models/PatientSessionData';
import { PredictDropoutErrors } from '../../infrastructure/endpoints/predictDropout/errors';

export async function processDropoutAnalysis(
    repository: DropoutRepository,
    patientId?: number
): Promise<DropoutRisk[] | PredictDropoutErrors> {
    try {
        const data = await repository.getPatientSessionData(patientId);

        if (!data || data.length === 0) {
            return 'NO_DATA';
        }

        const patientsMap = groupSessionsByPatient(data);
        const results = calculateDropoutRisks(patientsMap);

        return results.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
        return 'ANALYSIS_FAILED';
    }
}

function groupSessionsByPatient(data: PatientSessionData[]) {
    const patientsMap = new Map<string, { name: string; sessions: PatientSessionData[] }>();
    data.forEach((row) => {
        const id = row.patientId.toString();
        if (!patientsMap.has(id)) {
            patientsMap.set(id, { name: row.name, sessions: [] });
        }
        patientsMap.get(id)!.sessions.push(row);
    });
    return patientsMap;
}

function calculateDropoutRisks(patientsMap: Map<string, { name: string; sessions: PatientSessionData[] }>): DropoutRisk[] {
    const now = new Date();
    return Array.from(patientsMap.entries()).map(([id, p]) => {
        const sessions = [...p.sessions].sort((a, b) =>
            new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()
        );
        const nextSession = sessions.find((s) => s.sessionStatus !== 'completed');
        const lastCompleted = [...sessions].reverse().find((s) => s.sessionStatus === 'completed');

        let riskScore = 0;
        const factors: string[] = [];

        if (nextSession) {
            const assignedDate = new Date(nextSession.assignedDate);
            const diffDays = Math.ceil((assignedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) { riskScore += 50; factors.push('Retraso en calendario'); }
            else if (diffDays > 7) { riskScore -= 30; }
        }

        if (lastCompleted && lastCompleted.postEval > 7) {
            riskScore += 20; factors.push('Mareo elevado en ultima sesion');
        }

        const clamped = Math.max(0, Math.min(100, riskScore));
        return {
            patientId: id,
            name: p.name,
            riskScore: clamped,
            status: clamped > 70 ? 'CRITICAL' : clamped > 40 ? 'MODERATE' : 'LOW',
            bufferDays: nextSession ? Math.ceil((new Date(nextSession.assignedDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
            factors
        };
    });
}