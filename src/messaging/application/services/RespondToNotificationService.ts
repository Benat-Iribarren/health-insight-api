import { ResponseRepository } from '../../domain/interfaces/ResponseRepository';
import { NotificationRepository } from '../../domain/interfaces/NotificationRepository';
import {
    RespondToNotificationError,
    invalidNotificationIdError,
    alreadyRespondedError,
    operationFailedError,
} from '../types/RespondToNotificationError';
import { canRespondToMessage, isValidMessageId } from '../../domain/logic/respondPolicy';

export class RespondToNotificationService {
    constructor(
        private readonly responseRepository: ResponseRepository,
        private readonly notificationRepository: NotificationRepository
    ) {}

    async execute(input: {
        patientId: number;
        messageId: string;
        subject: string;
    }): Promise<'SUCCESSFUL' | RespondToNotificationError> {
        if (!isValidMessageId(input.messageId)) return invalidNotificationIdError;

        try {
            const exists = await this.responseRepository.existsByMessageId(input.messageId);
            if (!canRespondToMessage(exists)) return alreadyRespondedError;

            const notification = await this.notificationRepository.findByPatient(input.patientId, input.messageId);
            if (!notification) return invalidNotificationIdError;

            await this.responseRepository.create({
                patientId: input.patientId,
                subject: input.subject,
                messageId: input.messageId,
            });

            await this.notificationRepository.markRead(input.patientId, input.messageId);

            return 'SUCCESSFUL';
        } catch {
            return operationFailedError;
        }
    }
}