import { ResponseRepository } from '../../domain/interfaces/ResponseRepository';
import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import {
    ManageResponsesError,
    invalidResponseIdError,
    notFoundError,
    operationFailedError,
} from '../types/ManageResponsesError';
import { isUuid } from '../../domain/validation/isUuid';
import { shouldCascadeDeleteNotificationWhenDeletingResponse } from '../../domain/logic/responsePolicy';

export class DeleteResponseService {
    constructor(
        private readonly responseRepository: ResponseRepository,
        private readonly notificationRepository: NotificationRepository
    ) {}

    async execute(responseId: string): Promise<'SUCCESSFUL' | ManageResponsesError> {
        if (!responseId || !isUuid(responseId)) return invalidResponseIdError;

        try {
            const messageId = await this.responseRepository.getMessageIdByResponseId(responseId);
            if (!messageId) return notFoundError;

            const deleted = await this.responseRepository.deleteById(responseId);
            if (!deleted) return notFoundError;

            if (shouldCascadeDeleteNotificationWhenDeletingResponse()) {
                await this.notificationRepository.hardDelete(messageId);
            }

            return 'SUCCESSFUL';
        } catch {
            return operationFailedError;
        }
    }
}