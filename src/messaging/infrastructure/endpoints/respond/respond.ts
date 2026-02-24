import { FastifyInstance } from 'fastify';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { PatientResponseRepository } from '../../../domain/interfaces/PatientResponseRepository';
import { RespondToNotificationService } from '../../../application/services/RespondToNotificationService';
import { RespondToNotificationError } from '../../../application/types/RespondToNotificationError';
import { respondSchema } from './schema';

export const RESPOND_ENDPOINT = '/messaging/respond';

type StatusCode = 200 | 400 | 401 | 404 | 500;

const statusToCode: Record<
    RespondToNotificationError | 'INVALID_INPUT' | 'SUCCESSFUL',
    StatusCode
> = {
    SUCCESSFUL: 200,
    INVALID_INPUT: 400,
    NOTIFICATION_NOT_FOUND: 404,
    ALREADY_RESPONDED: 400,
    SAVE_FAILED: 500,
};

const statusToMessage: Record<
    RespondToNotificationError | 'INVALID_INPUT',
    { error: string }
> = {
    INVALID_INPUT: { error: 'Invalid input' },
    NOTIFICATION_NOT_FOUND: { error: 'No data found' },
    ALREADY_RESPONDED: { error: 'No se puede enviar más de una respuesta para este mensaje.' },
    SAVE_FAILED: { error: 'Internal server error' },
};

interface RespondDependencies {
    notificationRepo: NotificationRepository;
    patientResponseRepo: PatientResponseRepository;
}

function respond(dependencies: RespondDependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.post(RESPOND_ENDPOINT, respondSchema, async (request, reply) => {
            try {
                const patientId = request.auth?.patientId;

                if (!patientId || Number.isNaN(patientId) || patientId <= 0) {
                    return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);
                }

                const { subject, messageId } = request.body as { subject: string; messageId: string };

                if (!subject?.trim() || !messageId?.trim()) {
                    return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);
                }

                const result = await RespondToNotificationService(
                    dependencies.notificationRepo,
                    dependencies.patientResponseRepo,
                    patientId,
                    subject.trim(),
                    messageId.trim()
                );

                if (result !== 'SUCCESSFUL') {
                    return reply.status(statusToCode[result]).send({
                        ...statusToMessage[result as RespondToNotificationError],
                    });
                }

                return reply.status(statusToCode.SUCCESSFUL).send({
                    message: 'Response saved.',
                    data: {
                        messageId: messageId.trim(),
                        createdAt: new Date().toISOString(),
                    },
                });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(statusToCode.SAVE_FAILED).send(statusToMessage.SAVE_FAILED);
            }
        });
    };
}

export default respond;