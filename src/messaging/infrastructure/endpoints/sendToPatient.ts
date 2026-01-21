import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SendToPatient } from '../../application/SendToPatient';

export default function sendToPatient(deps: any) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-to-patient', async (request: FastifyRequest, reply: FastifyReply) => {
            const { patientId, subject, body } = request.body as any;
            try {
                const service = new SendToPatient(
                    deps.patientContactRepo,
                    deps.mailRepo,
                    deps.notificationRepo
                );

                const success = await service.execute({ patientId, subject, body });

                if (!success) {
                    return reply.status(400).send({ status: 'error', message: 'Failed to send' });
                }

                return reply.status(200).send({ status: 'success' });
            } catch (error) {
                return reply.status(500).send({ status: 'error' });
            }
        });
    };
}