import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SyncDailyBiometrics } from '../../application/use-cases/SyncDailyBiometrics';
import { SupabaseBiometricsRepository } from '../database/SupabaseBiometricsRepository';

export default function syncDailyBiometrics(repository: SupabaseBiometricsRepository) {
    return async function (fastify: FastifyInstance) {
        const useCase = new SyncDailyBiometrics(repository);

        fastify.post('/biometrics/sync-daily', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const { date } = request.body as { date?: string };
                const targetDate = date || new Date().toISOString().split('T')[0];

                if ((request as any).isCron) {
                    useCase.execute(targetDate);
                    return reply.status(202).send({ status: 'accepted' });
                }

                const result = await useCase.execute(targetDate);
                return reply.status(200).send(result);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Unknown error';
                return reply.status(500).send({ status: 'error', message });
            }
        });
    };
}