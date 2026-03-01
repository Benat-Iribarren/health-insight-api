import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { Notification } from '../../domain/models/Notification';
import {
    ManageNotificationsError,
    invalidNotificationIdError,
    notFoundError,
    operationFailedError,
} from '../types/ManageNotificationsError';
import { isValidNotificationId, shouldMarkNotificationAsRead } from '../../domain/logic/notificationPolicy';

export class ReadNotificationService {
    constructor(private readonly repository: NotificationRepository) {}

    async execute(input: { patientId: number; notificationId: string }): Promise<Notification | ManageNotificationsError> {
        if (!isValidNotificationId(input.notificationId)) return invalidNotificationIdError;

        try {
            const n = await this.repository.findByPatient(input.patientId, input.notificationId);
            if (!n) return notFoundError;

            if (shouldMarkNotificationAsRead(n)) {
                const ok = await this.repository.markRead(input.patientId, input.notificationId);
                if (!ok) return operationFailedError;
                return { ...n, isRead: true };
            }

            return n;
        } catch {
            return operationFailedError;
        }
    }
}