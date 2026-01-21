import { FastifyInstance } from 'fastify';
import { SendToPatient } from '../../application/use-cases/SendToPatient';

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
                    patientId: number,
                    subject: string,
                    body: string
                };

                await useCase.execute({
                    patientId,
                    subject,
                    body
                });

                return reply.status(200).send({ status: 'ok' });
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Error desconocido';
                return reply.status(500).send({ status: 'error', message });
            }
        });
    };
}