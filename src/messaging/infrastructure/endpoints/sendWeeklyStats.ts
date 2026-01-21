import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';

export default function sendWeeklyStats(deps: any) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-weekly-stats', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const service = new SendWeeklyStats(
                    deps.statsRepo,
                    deps.mailRepo,
                    deps.notificationRepo
                );

                if ((request as any).isCron) {
                    service.execute();
                    return reply.status(202).send({ status: 'accepted' });
                }

                const totalProcessed = await service.execute();
                return reply.status(200).send({
                    status: 'success',
                    processed: totalProcessed
                });
            } catch (error) {
                return reply.status(500).send({ status: 'error' });
            }
        });
    };
}