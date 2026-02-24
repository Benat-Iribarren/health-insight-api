import { Notification, NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { ManageNotificationsError } from '../types/ManageNotificationsError';

type NotificationRow = Notification & { is_deleted?: boolean };

export async function GetPatientInboxService(
    notificationRepo: NotificationRepository,
    patientId: number
): Promise<Notification[] | ManageNotificationsError> {
    try {
        const rows = (await notificationRepo.getPatientNotifications(patientId)) as NotificationRow[];

        return rows
            .filter((n) => n.is_deleted === false)
            .map(({ is_deleted: _ignored, ...rest }) => rest);
    } catch {
        return 'OPERATION_FAILED';
    }
}

export async function ReadNotificationService(
    notificationRepo: NotificationRepository,
    patientId: number,
    notificationId: string
): Promise<Notification | ManageNotificationsError> {
    try {
        const detail = (await notificationRepo.getNotificationDetail(patientId, notificationId)) as NotificationRow | null;
        if (!detail) return 'NOT_FOUND';
        if (detail.is_deleted === true) return 'NOT_FOUND';

        if (!detail.is_read) {
            await notificationRepo.markAsRead(patientId, notificationId);
        }

        const { is_deleted: _ignored, ...rest } = detail;
        return rest;
    } catch {
        return 'OPERATION_FAILED';
    }
}

export async function DeleteNotificationService(
    notificationRepo: NotificationRepository,
    patientId: number,
    notificationId: string
): Promise<'SUCCESSFUL' | ManageNotificationsError> {
    try {
        const detail = await notificationRepo.getNotificationDetail(patientId, notificationId);
        if (!detail) return 'NOT_FOUND';

        await notificationRepo.markNotificationAsDeleted(patientId, notificationId);
        return 'SUCCESSFUL';
    } catch {
        return 'OPERATION_FAILED';
    }
}