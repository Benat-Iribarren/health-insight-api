import { FastifyInstance } from 'fastify';
import { ManageNotifications } from '../../application/ManageNotifications';

export default function patientNotifications(deps: any) {
    return async function (fastify: FastifyInstance) {
        const service = new ManageNotifications(deps.notificationRepo);

        fastify.get('/messaging/notifications/unread-count', async (request) => {
            const patientId = (request as any).user.patientId;
            const count = await service.getUnreadCount(patientId);
            return { status: 'success', count };
        });

        fastify.get('/messaging/notifications', async (request) => {
            const patientId = (request as any).user.patientId;
            const messages = await service.getInbox(patientId);
            return { status: 'success', data: messages };
        });

        fastify.get('/messaging/notifications/:id', async (request, reply) => {
            const patientId = (request as any).user.patientId;
            const messageId = (request.params as any).id;
            const message = await service.readMessage(patientId, messageId);

            if (!message) {
                return reply.status(404).send({ status: 'error', message: 'Not found' });
            }
            return { status: 'success', data: message };
        });

        fastify.delete('/messaging/notifications/:id', async (request) => {
            const patientId = (request as any).user.patientId;
            const messageId = (request.params as any).id;
            await service.deleteMessage(patientId, messageId);
            return { status: 'success' };
        });
    };
}