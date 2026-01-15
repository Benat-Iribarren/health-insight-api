import { FastifyInstance } from 'fastify';
import { SendToPatient } from '../../application/SendToPatient';

export default function sendToPatient(deps: any) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-to-patient', async (request, reply) => {
            try {
                const { patientId, subject, body } = request.body as {
                    patientId: number;
                    subject: string;
                    body: string;
                };

                const service = new SendToPatient(
                    deps.patientContactRepo,
                    deps.mailRepo,
                    deps.notificationRepo
                );

                const success = await service.execute({
                    patientId,
                    subject,
                    body
                });

                if (!success) {
                    return reply.status(404).send({
                        status: 'error',
                        message: 'No se pudo encontrar el contacto del paciente'
                    });
                }

                return reply.status(200).send({
                    status: 'success',
                    message: 'Mensaje guardado y notificación enviada correctamente'
                });

            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    status: 'error',
                    message: 'Error interno al procesar el envío'
                });
            }
        });
    };
}