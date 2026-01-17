import { FastifyReply, FastifyRequest } from 'fastify';
import { SyncDailyBiometrics } from '../../application/use-cases/SyncDailyBiometrics';
import { SupabaseBiometricsRepository } from '../database/SupabaseBiometricsRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

export default function syncDailyBiometrics() {
    const repository = new SupabaseBiometricsRepository(supabaseClient);
    const useCase = new SyncDailyBiometrics(repository);

    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const cronSecret = request.headers['x-health-insight-cron'];
            const isCron = cronSecret === process.env.CRON_SECRET_KEY;
            const isProfessional = (request as any).user?.role === 'professional';

            if (!isCron && !isProfessional) {
                return reply.status(403).send({status: 'error', message: 'Unauthorized'});
            }

            const targetDate = new Date();
            targetDate.setUTCDate(targetDate.getUTCDate() - 2);
            const dateStr = targetDate.toISOString().split('T')[0];

            const summary = await useCase.execute(dateStr);

            return reply.status(200).send({
                status: 'success',
                dateProcessed: dateStr,
                summary
            });
        } catch (e: any) {
            return reply.status(500).send({ status: 'error', message: e.message });
        }
    };
}