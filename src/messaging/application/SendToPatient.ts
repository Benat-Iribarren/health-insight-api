import { PatientContactRepository } from "../domain/interfaces/PatientContactRepository";
import { OutboxRepository } from "../domain/interfaces/OutboxRepository";

export class SendToPatient {
    constructor(
        private readonly patientContactRepo: PatientContactRepository,
        private readonly outboxRepo: OutboxRepository
    ) {}

    async execute(input: { patientId: number; subject: string; body: string }): Promise<boolean> {
        const email = await this.patientContactRepo.getEmailByPatientId(input.patientId);

        if (!email) {
            return false;
        }

        await this.outboxRepo.save({
            patientId: input.patientId,
            type: 'DIRECT_MESSAGE',
            payload: {
                email: email,
                subject: input.subject,
                body: input.body
            }
        });

        return true;
    }
}