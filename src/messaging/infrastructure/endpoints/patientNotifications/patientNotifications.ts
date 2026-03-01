import { FastifyInstance } from 'fastify';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { GetPatientInboxService } from '../../../application/services/GetPatientInboxService';
import { ReadNotificationService } from '../../../application/services/ReadNotificationService';
import { DeleteNotificationService } from '../../../application/services/DeleteNotificationService';
import { ManageNotificationsError } from '../../../application/types/ManageNotificationsError';
import { getNotificationsSchema, readNotificationSchema, deleteNotificationSchema } from './schema';

export const GET_NOTIFICATIONS_ENDPOINT = '/messaging/notifications';
export const NOTIFICATION_BY_ID_ENDPOINT = '/messaging/notifications/:id';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<ManageNotificationsError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_NOTIFICATION_ID: 400,
    NOT_FOUND: 404,
    OPERATION_FAILED: 500,
};

const statusToMessage: Record<ManageNotificationsError, { error: string }> = {
    INVALID_NOTIFICATION_ID: { error: 'Invalid input' },
    NOT_FOUND: { error: 'No data found' },
    OPERATION_FAILED: { error: 'Internal server error' },
};

interface NotificationsDependencies {
    notificationRepo: NotificationRepository;
}

function patientNotifications(dependencies: NotificationsDependencies) {
    return async function (fastify: FastifyInstance) {
        const getInbox = new GetPatientInboxService(dependencies.notificationRepo);
        const readNotification = new ReadNotificationService(dependencies.notificationRepo);
        const deleteNotification = new DeleteNotificationService(dependencies.notificationRepo);

        fastify.get(GET_NOTIFICATIONS_ENDPOINT, getNotificationsSchema, async (request, reply) => {
            const result = await getInbox.execute(request.auth!.patientId!);
            if (typeof result === 'string') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send(result);
        });

        fastify.patch(NOTIFICATION_BY_ID_ENDPOINT, readNotificationSchema, async (request, reply) => {
            const { id } = request.params as { id: string };
            const result = await readNotification.execute({ patientId: request.auth!.patientId!, notificationId: id });
            if (typeof result === 'string') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send(result);
        });

        fastify.delete(NOTIFICATION_BY_ID_ENDPOINT, deleteNotificationSchema, async (request, reply) => {
            const { id } = request.params as { id: string };
            const result = await deleteNotification.execute({ patientId: request.auth!.patientId!, notificationId: id });
            if (result !== 'SUCCESSFUL') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send({ id, message: 'Notification deleted successfully' });
        });
    };
}

export default patientNotifications;
