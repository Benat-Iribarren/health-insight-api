import { StatsRepository } from "@src/messaging/domain/interfaces/StatsRepository";
import { MailRepository } from "@src/messaging/domain/interfaces/MailRepository";
import { HtmlImageGenerator } from "@src/messaging/infrastructure/images/HtmlImageGenerator";
import { MESSAGING_RESPONSES } from "@src/messaging/domain/MessagingError";

export class SendWeeklyStats {
    constructor(
        private readonly statsRepo: StatsRepository,
        private readonly mailRepo: MailRepository,
        private readonly imageGen: HtmlImageGenerator
    ) {}

    async execute(): Promise<{ processed: number } | { type: string }> {
        try {
            const now = new Date();
            const startOfLastWeek = new Date(now);
            const dayDiff = (now.getDay() || 7) - 1;
            startOfLastWeek.setDate(now.getDate() - dayDiff - 7);
            startOfLastWeek.setHours(0, 0, 0, 0);

            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            endOfLastWeek.setHours(23, 59, 59, 999);

            const endOfCurrentWeek = new Date(endOfLastWeek);
            endOfCurrentWeek.setDate(endOfLastWeek.getDate() + 7);
            endOfCurrentWeek.setHours(23, 59, 59, 999);

            const allSessions = await this.statsRepo.getSessionsInRange(startOfLastWeek, endOfCurrentWeek);

            if (allSessions.length === 0) {
                return { type: MESSAGING_RESPONSES.ERRORS.NO_STATS_DATA.code };
            }

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
                    if (s.state === 'completed') p.completed++;
                    else if (s.state === 'in_progress') p.inProgress++;
                    else if (s.state === 'assigned') p.notStarted++;
                } else if (s.state === 'assigned') {
                    p.nextWeekSessions++;
                }
            });

            for (const [_, stats] of patientMap) {
                const chartBuffer = await this.imageGen.generateWeeklyDashboard(stats);
                await this.mailRepo.send(stats.email, "Tu Resumen Semanal", "Aquí tienes el balance de tu actividad de la última semana. ¡Sigue adelante con tu recuperación!", stats, chartBuffer);
            }

            return { processed: patientMap.size };
        } catch (error) {
            return { type: MESSAGING_RESPONSES.ERRORS.MAIL_FAILURE.code };
        }
    }
}