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
        // 1. Localizar el destino
        const email = await this.patientContactRepo.getEmailByPatientId(input.patientId);
        if (!email) return false;

        // 2. Guardar la notificación en la base de datos
        await this.notificationRepo.saveNotification(
            input.patientId,
            input.subject,
            input.body
        );

        // 3. Obtener el conteo actualizado de pendientes para el badge del email
        const pendingCount = await this.notificationRepo.getPendingCount(input.patientId);

        // 4. Enviar el correo usando el layout profesional
        // Pasamos pendingCount para que el MailRepository use la lógica de singular/plural
        const result = await this.mailRepo.send(
            email,
            input.subject,
            input.body,
            pendingCount
        );

        return result.success;
    }
}