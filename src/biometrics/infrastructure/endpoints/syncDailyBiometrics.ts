import { FastifyReply, FastifyRequest } from 'fastify';
import { SyncDailyBiometrics } from '../../application/use-cases/SyncDailyBiometrics';

export default function syncDailyBiometrics() {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const cronSecret = request.headers['x-health-insight-cron'];
        if (!cronSecret || cronSecret !== process.env.CRON_SECRET_KEY) {
            return reply.status(403).send({ status: 'error', message: 'Unauthorized' });
        }

        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        try {
            const useCase = new SyncDailyBiometrics();
            const summary = await useCase.execute(dateStr);

            return reply.status(200).send({
                status: 'success',
                date: dateStr,
                summary // Esto te dirá filesFound y rowsInserted en tu terminal
            });
        } catch (error: any) {
            return reply.status(500).send({ status: 'error', message: error.message });
        }
    };
}