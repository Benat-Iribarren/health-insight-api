import { FastifyInstance } from 'fastify';
import { ResponseRepository } from '../../../domain/interfaces/ResponseRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { RespondToNotificationService } from '../../../application/services/RespondToNotificationService';
import { RespondToNotificationError } from '../../../application/types/RespondToNotificationError';
import { respondSchema } from './schema';

export const RESPOND_ENDPOINT = '/messaging/respond';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<RespondToNotificationError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_NOTIFICATION_ID: 400,
    ALREADY_RESPONDED: 400,
    OPERATION_FAILED: 500,
};

const statusToMessage: Record<RespondToNotificationError, { error: string }> = {
    INVALID_NOTIFICATION_ID: { error: 'Invalid input' },
    ALREADY_RESPONDED: { error: 'Already responded' },
    OPERATION_FAILED: { error: 'Internal server error' },
};

interface RespondDependencies {
    responseRepo: ResponseRepository;
    notificationRepo: NotificationRepository;
}

function respond(deps: RespondDependencies) {
    return async function (fastify: FastifyInstance) {
        const useCase = new RespondToNotificationService(deps.responseRepo, deps.notificationRepo);

        fastify.post(RESPOND_ENDPOINT, respondSchema, async (request, reply) => {
            const body = request.body as { messageId: string; subject: string };
            const result = await useCase.execute({
                patientId: request.auth!.patientId!,
                messageId: body.messageId,
                subject: body.subject,
            });

            if (result !== 'SUCCESSFUL') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send({ message: 'Response created' });
        });
    };
}

export default respond;
