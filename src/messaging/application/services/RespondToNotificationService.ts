import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { PatientResponseRepository } from '../../domain/interfaces/PatientResponseRepository';
import { RespondToNotificationError } from '../types/RespondToNotificationError';

export async function RespondToNotificationService(
    notificationRepo: NotificationRepository,
    patientResponseRepo: PatientResponseRepository,
    patientId: number,
    subject: string,
    messageId: string
): Promise<'SUCCESSFUL' | RespondToNotificationError> {

    const notification = await notificationRepo.getNotificationDetail(patientId, messageId);
    if (!notification) return 'NOTIFICATION_NOT_FOUND';

    const alreadyExists = await patientResponseRepo.existsByMessageId(messageId);
    if (alreadyExists) return 'ALREADY_RESPONDED';

    try {
        await patientResponseRepo.saveResponse(patientId, subject, messageId);
        return 'SUCCESSFUL';
    } catch {
        return 'SAVE_FAILED';
    }
}