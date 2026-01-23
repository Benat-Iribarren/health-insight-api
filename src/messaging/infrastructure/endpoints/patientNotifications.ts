import { FastifyInstance } from 'fastify';
import { ManageNotifications } from '../../application/use-cases/ManageNotifications';
import { MESSAGING_RESPONSES } from '@src/messaging/domain/responses/MessagingResponses';

export default function patientNotifications(deps: any) {
    return async function (fastify: FastifyInstance) {
        const service = new ManageNotifications(deps.notificationRepo);

        fastify.get('/messaging/notifications/unread-count', async (request) => {
            const patientId = (request as any).user?.patientId ?? 1;
            const count = await service.getUnreadCount(patientId);
            return { count };
        });

        fastify.get('/messaging/notifications', async (request) => {
            const patientId = (request as any).user?.patientId ?? 1;
            const messages = await service.getInbox(patientId);
            return { data: messages };
        });

        fastify.get('/messaging/notifications/:id', async (request, reply) => {
            const patientId = (request as any).user?.patientId ?? 1;
            const messageId = (request.params as any).id;
            const message = await service.readMessage(patientId, messageId);

            if (!message) {
                const err = MESSAGING_RESPONSES.ERRORS.NOT_FOUND;
                return reply.status(err.status).send({ message: err.message });
            }

            return { data: message };
        });

        fastify.delete('/messaging/notifications/:id', async (request) => {
            const patientId = (request as any).user?.patientId ?? 1;
            const messageId = (request.params as any).id;
            await service.deleteMessage(patientId, messageId);
            return {};
        });
    };
}
