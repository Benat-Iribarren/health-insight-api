import { StatsRepository } from "../domain/interfaces/StatsRepository";
import { MailRepository } from "../domain/interfaces/MailRepository";
import { HtmlImageGenerator } from "../infrastructure/images/HtmlImageGenerator";

export class SendWeeklyStats {
    constructor(
        private readonly statsRepo: StatsRepository,
        private readonly mailRepo: MailRepository,
        private readonly imageGen: HtmlImageGenerator
    ) {}

    async execute(): Promise<{ processed: number }> {
        const now = new Date();

        // 1. Lunes de la semana pasada (22 de diciembre)
        const startOfLastWeek = new Date(now);
        const dayDiff = (now.getDay() || 7) - 1;
        startOfLastWeek.setDate(now.getDate() - dayDiff - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);

        // 2. Domingo de la semana pasada (28 de diciembre) - Punto de corte estadístico
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);

        // 3. Domingo de esta semana (4 de enero) - Fin de la planificación actual
        const endOfCurrentWeek = new Date(endOfLastWeek);
        endOfCurrentWeek.setDate(endOfLastWeek.getDate() + 7);
        endOfCurrentWeek.setHours(23, 59, 59, 999);

        const allSessions = await this.statsRepo.getSessionsInRange(startOfLastWeek, endOfCurrentWeek);
        const patientMap = new Map<number, any>();

        allSessions.forEach(s => {
            if (!patientMap.has(s.patient_id)) {
                patientMap.set(s.patient_id, {
                    patientName: s.patient_name,
                    email: s.email,
                    completed: 0,
                    inProgress: 0,
                    notStarted: 0,
                    nextWeekSessions: 0
                });
            }

            const p = patientMap.get(s.patient_id);
            const sessionDate = new Date(s.assigned_date);

            if (sessionDate <= endOfLastWeek) {
                // Métricas Retrospectivas (22 - 28 Dic)
                if (s.state === 'completed') p.completed++;
                else if (s.state === 'in_progress') p.inProgress++;
                else if (s.state === 'assigned') p.notStarted++;
            } else {
                // Planificación Semanal Actual (29 Dic - 4 Ene)
                if (s.state === 'assigned') p.nextWeekSessions++;
            }
        });

        for (const [_, stats] of patientMap) {
            const chartBuffer = await this.imageGen.generateWeeklyDashboard(stats);
            await this.mailRepo.send(stats.email, "Tu Resumen Semanal de Progreso", "", stats, chartBuffer);
        }

        return { processed: patientMap.size };
    }
}