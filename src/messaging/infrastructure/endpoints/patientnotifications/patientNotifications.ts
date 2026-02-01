import { FastifyInstance } from 'fastify';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import {
    getPatientInboxService,
    readNotificationService,
    deleteNotificationService,
} from '../../../application/services/ManageNotificationsService';
import { ManageNotificationsError } from '../../../application/types/ManageNotificationsError';
import { getNotificationsSchema, readNotificationSchema, deleteNotificationSchema } from './schema';

export const GET_NOTIFICATIONS_ENDPOINT = '/messaging/notifications';
export const NOTIFICATION_BY_ID_ENDPOINT = '/messaging/notifications/:id';

type StatusCode = 200 | 400 | 401 | 404 | 500;

const statusToCode: Record<ManageNotificationsError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_NOTIFICATION_ID: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    OPERATION_FAILED: 500,
};

const statusToMessage: Record<ManageNotificationsError, { error: string }> = {
    UNAUTHORIZED: { error: 'Unauthorized.' },
    INVALID_NOTIFICATION_ID: { error: 'The provided notification ID is invalid.' },
    NOT_FOUND: { error: 'Notification not found.' },
    OPERATION_FAILED: { error: 'An error occurred while processing notifications.' },
};

interface NotificationsDependencies {
    notificationRepo: NotificationRepository;
}

function patientNotifications(dependencies: NotificationsDependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.get(GET_NOTIFICATIONS_ENDPOINT, getNotificationsSchema, async (request, reply) => {
            try {
                const patientId = request.auth?.patientId;
                if (!patientId) {
                    return reply.status(statusToCode.UNAUTHORIZED).send(statusToMessage.UNAUTHORIZED);
                }

                const result = await getPatientInboxService(dependencies.notificationRepo, patientId);

                if (typeof result === 'string') {
                    return reply.status(statusToCode[result]).send(statusToMessage[result]);
                }

                return reply.status(200).send(result);
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        });

        fastify.post(NOTIFICATION_BY_ID_ENDPOINT, readNotificationSchema, async (request, reply) => {
            try {
                const patientId = request.auth?.patientId;
                if (!patientId) {
                    return reply.status(statusToCode.UNAUTHORIZED).send(statusToMessage.UNAUTHORIZED);
                }

                const { id } = request.params as { id: string };
                if (!id || id.trim().length === 0) {
                    return reply
                        .status(statusToCode.INVALID_NOTIFICATION_ID)
                        .send(statusToMessage.INVALID_NOTIFICATION_ID);
                }

                const result = await readNotificationService(dependencies.notificationRepo, patientId, id);

                if (typeof result === 'string') {
                    return reply.status(statusToCode[result]).send(statusToMessage[result]);
                }

                return reply.status(200).send(result);
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        });

        fastify.delete(NOTIFICATION_BY_ID_ENDPOINT, deleteNotificationSchema, async (request, reply) => {
            try {
                const patientId = request.auth?.patientId;
                if (!patientId) {
                    return reply.status(statusToCode.UNAUTHORIZED).send(statusToMessage.UNAUTHORIZED);
                }

                const { id } = request.params as { id: string };
                if (!id || id.trim().length === 0) {
                    return reply
                        .status(statusToCode.INVALID_NOTIFICATION_ID)
                        .send(statusToMessage.INVALID_NOTIFICATION_ID);
                }

                const result = await deleteNotificationService(dependencies.notificationRepo, patientId, id);

                if (result !== 'SUCCESSFUL') {
                    return reply.status(statusToCode[result]).send(statusToMessage[result]);
                }

                return reply.status(200).send({ ok: true });
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        });
    };
}

export default patientNotifications;
