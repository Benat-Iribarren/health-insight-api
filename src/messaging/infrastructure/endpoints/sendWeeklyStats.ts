import { FastifyInstance } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';

export default function sendWeeklyStats(deps: any) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-weekly-stats', async (_request, reply) => {
            try {
                const service = new SendWeeklyStats(
                    deps.statsRepo,
                    deps.mailRepo,
                    deps.notificationRepo
                );

                const totalProcessed = await service.execute();

                return reply.status(200).send({
                    status: 'success',
                    message: `Informes enviados a ${totalProcessed} pacientes.`
                });

            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({
                    status: 'error',
                    message: 'Error interno al procesar el envío masivo'
                });
            }
        });
    };
}