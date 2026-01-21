import { PatientContactRepository } from "../domain/interfaces/PatientContactRepository";
import { MailRepository } from "../domain/interfaces/MailRepository";
import { NotificationRepository } from "../domain/interfaces/NotificationRepository";

export interface SendToPatientInput {
    patientId: number;
    subject: string;
    body: string;
}

export class SendToPatient {
    constructor(
        private readonly patientContactRepo: PatientContactRepository,
        private readonly mailRepo: MailRepository,
        private readonly notificationRepo: NotificationRepository
    ) {}

    async execute(input: SendToPatientInput): Promise<boolean> {
        const email = await this.patientContactRepo.getEmailByPatientId(input.patientId);
        if (!email) return false;

        await this.notificationRepo.saveNotification(
            input.patientId,
            input.subject,
            input.body
        );

        const pendingCount = await this.notificationRepo.getPendingCount(input.patientId);

        const result = await this.mailRepo.send(
            email,
            input.subject,
            input.body,
            pendingCount
        );

        return result.success;
    }
}