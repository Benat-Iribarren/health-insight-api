import { PatientContactRepository } from "../domain/interfaces/PatientContactRepository";
import { MailRepository } from "../domain/interfaces/MailRepository";

export const patientEmailNotFoundErrorMsg = 'PATIENT_EMAIL_NOT_FOUND' as const;
export const successfulStatusMsg = 'SUCCESSFUL' as const;

export type SendToPatientResult = typeof patientEmailNotFoundErrorMsg | typeof successfulStatusMsg;

export class SendToPatient {
    constructor(
        private readonly patientContactRepo: PatientContactRepository,
        private readonly mailRepo: MailRepository
    ) {}

    async execute(input: { patientId: number; subject: string; body: string }): Promise<SendToPatientResult> {
        const email = await this.patientContactRepo.getEmailByPatientId(input.patientId);

        if (!email) {
            return patientEmailNotFoundErrorMsg;
        }

        await this.mailRepo.send(email, input.subject, input.body);
        return successfulStatusMsg;
    }
}