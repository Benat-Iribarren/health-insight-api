import { PatientContactRepository } from '../../domain/interfaces/PatientContactRepository';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { MailTemplateProvider } from '../../domain/interfaces/MailTemplateProvider';
import { SendToPatientError } from '../types/SendToPatientError';

export async function sendToPatientService(
    patientContactRepo: PatientContactRepository,
    mailRepo: MailRepository,
    notificationRepo: NotificationRepository,
    templateProvider: MailTemplateProvider,
    patientId: number,
    subject: string,
    body: string
): Promise<'SUCCESSFUL' | SendToPatientError> {
    const email = await patientContactRepo.getEmailByPatientId(patientId);
    if (!email) return 'PATIENT_NOT_FOUND';

    try {
        await notificationRepo.saveNotification(patientId, subject, body);
        const pendingCount = await notificationRepo.getPendingCount(patientId);
        const htmlContent = templateProvider.renderMessageNotification(pendingCount);

        const result = await mailRepo.send(email, subject, htmlContent, pendingCount);
        return result.success ? 'SUCCESSFUL' : 'SEND_FAILED';
    } catch (error) {
        return 'SEND_FAILED';
    }
}