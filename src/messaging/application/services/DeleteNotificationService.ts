import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import {
    ManageNotificationsError,
    invalidNotificationIdError,
    notFoundError,
    operationFailedError,
} from '../types/ManageNotificationsError';

export class DeleteNotificationService {
    constructor(private readonly repository: NotificationRepository) {}

    async execute(input: { patientId: number; notificationId: string }): Promise<'SUCCESSFUL' | ManageNotificationsError> {
        if (!input.notificationId) return invalidNotificationIdError;

        try {
            const ok = await this.repository.softDelete(input.patientId, input.notificationId);
            return ok ? 'SUCCESSFUL' : notFoundError;
        } catch {
            return operationFailedError;
        }
    }
}
