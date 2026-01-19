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
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const nextWeekLimit = new Date();
        nextWeekLimit.setDate(now.getDate() + 7);

        for (const patient of patientsData) {
            patient.completed = 0;
            patient.inProgress = 0;
            patient.notStarted = 0;
            patient.nextWeekCount = 0;

            patient.sessions?.forEach((s: any) => {
                const assignedDate = new Date(s.assigned_date);

                if (s.state === 'completed') {
                    patient.completed++;
                } else if (s.state === 'in_progress') {
                    patient.inProgress++;
                } else {
                    patient.notStarted++;
                }

                if (assignedDate > now && assignedDate <= nextWeekLimit) {
                    patient.nextWeekCount!++;
                }
            });

            if (patient.id) {
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