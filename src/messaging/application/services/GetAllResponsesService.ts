import { ResponseRepository } from '../../domain/interfaces/ResponseRepository';
import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import { Response } from '../../domain/models/Response';
import { ManageResponsesError, operationFailedError } from '../types/ManageResponsesError';
import { attachMessageContent } from '../../domain/logic/responsePolicy';

export type ResponseWithMessage = Response & { message: string };

export class GetAllResponsesService {
    constructor(
        private readonly responseRepository: ResponseRepository,
        private readonly notificationRepository: NotificationRepository
    ) {}

    async execute(): Promise<ResponseWithMessage[] | ManageResponsesError> {
        try {
            const responses = await this.responseRepository.listAll();
            if (responses.length === 0) return [];

            const ids = [...new Set(responses.map((r) => r.messageId))];
            const contents = await this.notificationRepository.getContentsByIds(ids);

            return attachMessageContent(responses, contents);
        } catch {
            return operationFailedError;
        }
    }
}