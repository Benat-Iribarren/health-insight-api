import { FastifyInstance } from 'fastify';
import { SendToPatient } from '../../application/use-cases/SendToPatient';
import { MESSAGING_RESPONSES } from '@src/messaging/domain/responses/MessagingResponses';

export default function sendToPatient(deps: any) {
    return async function (fastify: FastifyInstance) {
        const useCase = new SendToPatient(
            deps.patientContactRepo,
            deps.mailRepo,
            deps.notificationRepo,
            deps.templateProvider
        );

        fastify.post('/messaging/send-to-patient', async (request, reply) => {
            try {
                const { patientId, subject, body } = request.body as {
                    patientId: number;
                    subject: string;
                    body: string;
                };

                await useCase.execute({ patientId, subject, body });

                const res = MESSAGING_RESPONSES.SUCCESS.MESSAGE_SENT;
                return reply.status(res.status).send({ message: res.message });
            } catch {
                const err = MESSAGING_RESPONSES.ERRORS.UNKNOWN_ERROR;
                return reply.status(err.status).send({ message: err.message });
            }
        });
    };
}
