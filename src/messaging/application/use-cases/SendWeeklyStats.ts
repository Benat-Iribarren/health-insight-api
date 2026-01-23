import { MailRepository } from "../../domain/interfaces/MailRepository";
import { NotificationRepository } from "../../domain/interfaces/NotificationRepository";
import { StatsRepository, PatientStats } from "../../domain/interfaces/StatsRepository";
import { MailTemplateProvider } from "../../domain/interfaces/MailTemplateProvider";
import { PatientContactRepository } from "../../domain/interfaces/PatientContactRepository";
import { HtmlImageGenerator } from "../../infrastructure/images/HtmlImageGenerator";

export class SendWeeklyStats {
    private imageGenerator = new HtmlImageGenerator();

    constructor(
        private readonly statsRepo: StatsRepository,
        private readonly mailRepo: MailRepository,
        private readonly notificationRepo: NotificationRepository,
        private readonly patientContactRepo: PatientContactRepository,
        private readonly templateProvider: MailTemplateProvider
    ) {}

    async execute(targetPatientId?: number): Promise<void> {
        const patientsData = await this.statsRepo.getAllPatientsStats();
        const filteredPatients = targetPatientId
            ? patientsData.filter((p: PatientStats) => p.id === targetPatientId)
            : patientsData;

        for (const patient of filteredPatients) {
            this.calculateStats(patient);

            if (patient.id && patient.email) {
                const pendingCount = await this.notificationRepo.getPendingCount(patient.id);

                const imageBuffer = await this.imageGenerator.generateWeeklyDashboard({
                    completed: patient.completed,
                    inProgress: patient.inProgress,
                    notStarted: patient.notStarted
                });

                const htmlContent = this.templateProvider.renderWeeklyStats({
                    completed: patient.completed,
                    inProgress: patient.inProgress,
                    pending: patient.notStarted,
                    nextWeekSessions: patient.nextWeekSessions,
                    name: patient.name || 'Paciente'
                });

                await this.mailRepo.send(
                    patient.email,
                    "Tu resumen semanal de salud",
                    htmlContent,
                    pendingCount,
                    imageBuffer
                );
            }
        }
    }

    private calculateStats(patient: PatientStats) {
        patient.completed = 0;
        patient.inProgress = 0;
        patient.notStarted = 0;
        patient.nextWeekSessions = 0;

        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        patient.sessions?.forEach((s: any) => {
            const sessionDate = new Date(s.scheduled_at);
            if (sessionDate <= now) {
                if (s.state === 'completed') patient.completed++;
                else if (s.state === 'in_progress') patient.inProgress++;
                else patient.notStarted++;
            } else if (sessionDate > now && sessionDate <= nextWeek) {
                patient.nextWeekSessions++;
            }
        });
    }
}
