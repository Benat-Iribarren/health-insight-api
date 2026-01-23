import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SyncDailyBiometrics } from '../../application/use-cases/SyncDailyBiometrics';
import { SupabaseBiometricsRepository } from '../database/SupabaseBiometricsRepository';
import { BIOMETRICS_RESPONSES } from '@src/biometrics/domain/responses/BiometricsResponses';

const send = (reply: FastifyReply, err: { status: number; message: string }) =>
    reply.status(err.status).send({ status: 'error', message: err.message });

export default function syncDailyBiometrics(repository: SupabaseBiometricsRepository) {
    return async function (fastify: FastifyInstance) {
        const useCase = new SyncDailyBiometrics(repository);

        fastify.post('/biometrics/sync-daily', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const { date } = request.body as { date?: string };

                let targetDate = date;
                if (!targetDate) {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    targetDate = d.toISOString().split('T')[0];
                }

                if ((request as any).isCron) {
                    useCase.execute(targetDate);
                    const res = BIOMETRICS_RESPONSES.SUCCESS.SYNC_ACCEPTED;
                    return reply.status(res.status).send({
                        status: 'accepted',
                        targetDate,
                        message: res.message
                    });
                }

                const result = await useCase.execute(targetDate);
                const res = BIOMETRICS_RESPONSES.SUCCESS.OK;
                return reply.status(res.status).send(result);
            } catch {
                const err = BIOMETRICS_RESPONSES.ERRORS.UNKNOWN_ERROR;
                return send(reply, err);
            }
        });
    };
}
