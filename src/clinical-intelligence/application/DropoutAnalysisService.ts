import { DropoutRepository } from '../domain/interfaces/DropoutRepository';
import { DropoutRisk } from '../domain/models/DropoutRisk';

export class DropoutAnalysisService {
    constructor(private readonly repository: DropoutRepository) {}

    async execute(patientId?: string): Promise<DropoutRisk[]> {
        const data = await this.repository.getPatientSessionData(patientId);
        const patientsMap = new Map<string, { name: string, sessions: any[] }>();

        data.forEach(row => {
            if (!patientsMap.has(row.patientId)) {
                patientsMap.set(row.patientId, { name: row.name, sessions: [] });
            }
            if (row.sessionId) patientsMap.get(row.patientId)!.sessions.push(row);
        });

        const results: DropoutRisk[] = Array.from(patientsMap.entries()).map(([id, p]) => {
            const now = new Date();
            const sessions = p.sessions.sort((a, b) =>
                new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()
            );

            const nextSession = sessions.find(s => s.sessionStatus !== 'completed');
            const lastCompleted = [...sessions].reverse().find(s => s.sessionStatus === 'completed');

            let riskScore = 0;
            let factors: string[] = [];

            if (nextSession) {
                const assignedDate = new Date(nextSession.assignedDate);
                const diffDays = Math.ceil((assignedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    riskScore += 50;
                    factors.push('Retraso en calendario');
                } else if (diffDays > 7) {
                    riskScore -= 30;
                }

                if (nextSession.sessionStatus === 'in_progress' && nextSession.sessionUpdate) {
                    const lastUpdate = new Date(nextSession.sessionUpdate);
                    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

                    if (hoursSinceUpdate > 24) {
                        riskScore += 35;
                        factors.push('In-progress antiguo (>24h)');
                    } else if (hoursSinceUpdate > 1) {
                        riskScore += 10;
                        factors.push('In-progress reciente');
                    }
                }
            }

            if (lastCompleted && lastCompleted.postEval > 7) {
                riskScore += 20;
                factors.push('Mareo elevado en ultima sesion');
            }

            return {
                patientId: id,
                name: p.name,
                riskScore: Math.max(0, Math.min(100, riskScore)),
                status: riskScore > 70 ? 'CRITICAL' : riskScore > 40 ? 'MODERATE' : 'LOW',
                bufferDays: nextSession ? Math.ceil((new Date(nextSession.assignedDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
                factors
            };
        });

        return results.sort((a, b) => b.riskScore - a.riskScore);
    }
}