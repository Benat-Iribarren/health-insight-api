import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { PatientContactRepository } from '../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { MailTemplateProvider } from '../../domain/interfaces/MailTemplateProvider';
import { SendToPatientError, invalidInputError, noEmailError, operationFailedError } from '../types/SendToPatientError';
import { isValidSendToPatientInput } from '../../domain/logic/sendToPatientPolicy';

export class SendToPatientService {
    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly contactRepository: PatientContactRepository,
        private readonly mailRepository: MailRepository,
        private readonly templateProvider: MailTemplateProvider
    ) {}

    async execute(input: { patientId: number; subject: string; content: string }): Promise<'SUCCESSFUL' | SendToPatientError> {
        if (!isValidSendToPatientInput(input)) return invalidInputError;

        try {
            await this.notificationRepository.create({
                patientId: input.patientId,
                subject: input.subject,
                content: input.content,
            });

            const contact = await this.contactRepository.getPatientContact(input.patientId);
            if (!contact.email) return noEmailError;

            const pendingCount = await this.notificationRepository.pendingCount(input.patientId);

            const emailHtml = this.templateProvider.renderMessageNotification(pendingCount);

            await this.mailRepository.sendMail({
                to: contact.email,
                subject: input.subject,
                html: emailHtml,
            });

            return 'SUCCESSFUL';
        } catch {
            return operationFailedError;
        }
    }
}