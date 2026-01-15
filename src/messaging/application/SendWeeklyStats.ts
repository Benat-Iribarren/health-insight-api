import { MailRepository } from "../domain/interfaces/MailRepository";
import { NotificationRepository } from "../domain/interfaces/NotificationRepository";
import { StatsRepository } from "../domain/interfaces/StatsRepository";

export class SendWeeklyStats {
    constructor(
        private readonly statsRepo: StatsRepository,
        private readonly mailRepo: MailRepository,
        private readonly notificationRepo: NotificationRepository
    ) {}

    async execute(patientId: number): Promise<void> {
        const stats = await this.statsRepo.getPatientStats(patientId);

        const subject = "Tu resumen semanal de salud";
        const body = "Aquí tienes tus estadísticas de la semana.";

        await this.notificationRepo.saveNotification(
            patientId,
            subject,
            body
        );

        const pendingCount = await this.notificationRepo.getPendingCount(patientId);

        await this.mailRepo.send(
            stats.email,
            subject,
            body,
            pendingCount
        );
    }
}