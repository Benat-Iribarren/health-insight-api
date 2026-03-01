import { ResponseRepository } from '../../domain/interfaces/ResponseRepository';
import {
    ManageResponsesError,
    invalidResponseIdError,
    notFoundError,
    operationFailedError,
} from '../types/ManageResponsesError';
import { isUuid } from '../../domain/validation/isUuid';

export class MarkResponseAsReadService {
    constructor(private readonly responseRepository: ResponseRepository) {}

    async execute(responseId: string): Promise<'SUCCESSFUL' | ManageResponsesError> {
        if (!responseId || !isUuid(responseId)) return invalidResponseIdError;

        try {
            const ok = await this.responseRepository.markReadById(responseId);
            return ok ? 'SUCCESSFUL' : notFoundError;
        } catch {
            return operationFailedError;
        }
    }
}