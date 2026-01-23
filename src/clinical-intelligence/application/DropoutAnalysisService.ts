import { DropoutRepository } from '../domain/interfaces/DropoutRepository';
import { DropoutRisk } from '../domain/models/DropoutRisk';
import { AnalysisFailedError, NoDataError } from '../domain/errors/ClinicalErrors';

export class DropoutAnalysisService {
    constructor(private readonly repository: DropoutRepository) {}

    async execute(patientId?: string): Promise<DropoutRisk[]> {
        try {
            const data = await this.repository.getPatientSessionData(patientId);

            if (!data || data.length === 0) {
                throw new NoDataError();
            }

            const patientsMap = new Map<string, { name: string; sessions: any[] }>();

            data.forEach((row: any) => {
                if (!patientsMap.has(row.patientId)) {
                    patientsMap.set(row.patientId, { name: row.name, sessions: [] });
                }
                if (row.sessionId) {
                    patientsMap.get(row.patientId)!.sessions.push(row);
                }
            });

            const now = new Date();

            const results: DropoutRisk[] = Array.from(patientsMap.entries()).map(([id, p]) => {
                const sessions = p.sessions.sort(
                    (a, b) => new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()
                );

                const nextSession = sessions.find((s) => s.sessionStatus !== 'completed');
                const lastCompleted = [...sessions].reverse().find((s) => s.sessionStatus === 'completed');

                let riskScore = 0;
                const factors: string[] = [];

                if (nextSession) {
                    const assignedDate = new Date(nextSession.assignedDate);
                    const diffDays = Math.ceil(
                        (assignedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );

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

                const clamped = Math.max(0, Math.min(100, riskScore));
                const status = clamped > 70 ? 'CRITICAL' : clamped > 40 ? 'MODERATE' : 'LOW';

                const bufferDays = nextSession
                    ? Math.ceil((new Date(nextSession.assignedDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                return {
                    patientId: id,
                    name: p.name,
                    riskScore: clamped,
                    status,
                    bufferDays,
                    factors
                };
            });

            return results.sort((a, b) => b.riskScore - a.riskScore);
        } catch (e) {
            if (e instanceof NoDataError) throw e;
            throw new AnalysisFailedError();
        }
    }
}
