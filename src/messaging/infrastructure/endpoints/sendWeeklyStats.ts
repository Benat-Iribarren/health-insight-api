import { FastifyInstance } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';

export default function sendWeeklyStats(deps: any) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-weekly-stats', async (request, reply) => {
            try {
                const { patientId } = request.body as { patientId: number };

                const service = new SendWeeklyStats(
                    deps.statsRepo,
                    deps.mailRepo,
                    deps.notificationRepo
                );

                await service.execute(patientId);

                return reply.status(200).send({
                    status: 'success',
                    message: 'Estadísticas semanales enviadas correctamente'
                });

            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    status: 'error',
                    message: 'Error al enviar las estadísticas'
                });
            }
        });
    };
}