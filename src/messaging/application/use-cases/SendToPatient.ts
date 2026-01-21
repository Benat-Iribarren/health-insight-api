import { PatientContactRepository } from "../../domain/interfaces/PatientContactRepository";
import { MailRepository } from "../../domain/interfaces/MailRepository";
import { NotificationRepository } from "../../domain/interfaces/NotificationRepository";
import { MailTemplateProvider } from "../../domain/interfaces/MailTemplateProvider";

export interface SendToPatientInput {
    patientId: number;
    subject: string;
    body: string;
}

export class SendToPatient {
    constructor(
        private readonly patientContactRepo: PatientContactRepository,
        private readonly mailRepo: MailRepository,
        private readonly notificationRepo: NotificationRepository,
        private readonly templateProvider: MailTemplateProvider
    ) {}

    async execute(input: SendToPatientInput): Promise<boolean> {
        const email = await this.patientContactRepo.getEmailByPatientId(input.patientId);
        if (!email) return false;

        await this.notificationRepo.saveNotification(
            input.patientId,
            input.subject,
            input.body
        );

        const realCount = await this.notificationRepo.getPendingCount(input.patientId);

        const htmlContent = this.templateProvider.renderMessageNotification(realCount);

        const result = await this.mailRepo.send(
            email,
            input.subject,
            htmlContent,
            realCount
        );

        return result.success;
    }
}