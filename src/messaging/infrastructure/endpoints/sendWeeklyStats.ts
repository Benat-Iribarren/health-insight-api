import { FastifyReply, FastifyRequest } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';

export default function sendWeeklyStats(deps: any) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const cronSecret = request.headers['x-health-insight-cron'];
        const isCron = cronSecret === process.env.CRON_SECRET_KEY;
        const userId = (request as any).user?.id;

        if (!isCron && !userId) {
            return reply.status(401).send({ status: 'error', message: 'Unauthorized' });
        }

        try {
            const service = new SendWeeklyStats(
                deps.statsRepo,
                deps.mailRepo,
                deps.notificationRepo
            );

            service.execute();

            return reply.status(202).send({
                status: 'accepted'
            });
        } catch (error) {
            return reply.status(500).send({ status: 'error' });
        }
    };
}