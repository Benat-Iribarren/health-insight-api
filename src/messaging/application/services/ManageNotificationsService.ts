import {Notification, NotificationRepository} from '../../domain/interfaces/NotificationRepository';
import {ManageNotificationsError} from '../types/ManageNotificationsError';

export async function getPatientInboxService(
    notificationRepo: NotificationRepository,
    patientId: number
): Promise<Notification[] | ManageNotificationsError> {
    try {
        return await notificationRepo.getPatientNotifications(patientId);
    } catch {
        return 'OPERATION_FAILED';
    }
}

export async function readNotificationService(
    notificationRepo: NotificationRepository,
    patientId: number,
    notificationId: string
): Promise<Notification | ManageNotificationsError> {
    try {
        const detail = await notificationRepo.getNotificationDetail(patientId, notificationId);
        if (!detail) return 'NOT_FOUND';

        if (!detail.is_read) {
            await notificationRepo.markAsRead(patientId, notificationId);
        }

        return detail;
    } catch {
        return 'OPERATION_FAILED';
    }
}

export async function deleteNotificationService(
    notificationRepo: NotificationRepository,
    patientId: number,
    notificationId: string
): Promise<'SUCCESSFUL' | ManageNotificationsError> {
    try {
        const detail = await notificationRepo.getNotificationDetail(patientId, notificationId);
        if (!detail) return 'NOT_FOUND';

        await notificationRepo.deleteNotification(patientId, notificationId);
        return 'SUCCESSFUL';
    } catch {
        return 'OPERATION_FAILED';
    }
}
