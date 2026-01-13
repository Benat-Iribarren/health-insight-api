import { PatientContactRepository } from "../domain/interfaces/PatientContactRepository";
import { MailRepository } from "../domain/interfaces/MailRepository"; // Cambiado de OutboxRepository

export class SendToPatient {
    constructor(
        private readonly patientContactRepo: PatientContactRepository,
        private readonly mailRepo: MailRepository // Ahora inyectamos el MailRepository
    ) {}

    async execute(input: { patientId: number; subject: string; body: string }): Promise<boolean> {
        const email = await this.patientContactRepo.getEmailByPatientId(input.patientId);

        if (!email) {
            return false;
        }

        // ENVÍO DIRECTO: Llamamos al repositorio SMTP de forma síncrona
        const result = await this.mailRepo.send(email, input.subject, input.body);

        return result.success;
    }
}