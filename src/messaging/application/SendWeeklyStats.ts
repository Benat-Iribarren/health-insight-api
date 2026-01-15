import { MailRepository } from "../domain/interfaces/MailRepository";
import { NotificationRepository } from "../domain/interfaces/NotificationRepository";
import { StatsRepository } from "../domain/interfaces/StatsRepository";

export class SendWeeklyStats {
    constructor(
        private readonly statsRepo: StatsRepository,
        private readonly mailRepo: MailRepository,
        private readonly notificationRepo: NotificationRepository
    ) {}

    async execute(): Promise<number> {
        const patientsData = await this.statsRepo.getAllPatientsStats();
        let count = 0;

        for (const patient of patientsData) {
            patient.completed = 0;
            patient.inProgress = 0;
            patient.notStarted = 0;

            patient.sessions?.forEach(s => {
                if (s.state === 'completed') patient.completed++;
                else if (s.state === 'in_progress') patient.inProgress++;
                else if (s.state === 'not_started') patient.notStarted++;
            });

            if (patient.id) {
                await this.notificationRepo.saveNotification(
                    patient.id,
                    "Tu resumen semanal de salud",
                    "Aquí tienes tus estadísticas de la semana."
                );

                const pendingCount = await this.notificationRepo.getPendingCount(patient.id);

                await this.mailRepo.send(
                    patient.email,
                    "Tu resumen semanal de salud",
                    "",
                    pendingCount,
                    patient
                );

                count++;
            }
        }
        return count;
    }
}