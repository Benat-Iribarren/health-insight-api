import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { Notification } from '../../domain/models/Notification';
import { ManageNotificationsError, operationFailedError } from '../types/ManageNotificationsError';

export class GetPatientInboxService {
    constructor(private readonly repository: NotificationRepository) {}

    async execute(patientId: number): Promise<Notification[] | ManageNotificationsError> {
        try {
            return await this.repository.listByPatient(patientId);
        } catch {
            return operationFailedError;
        }
    }
}
