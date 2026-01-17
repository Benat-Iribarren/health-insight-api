import { FastifyReply, FastifyRequest } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';

export default function sendWeeklyStats(deps: any) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const cronSecret = request.headers['x-health-insight-cron'];
        const isCron = cronSecret === process.env.CRON_SECRET_KEY;

        const userId = (request as any).user?.id;
        const userRepo = new SupabaseUserRepository(supabaseClient);
        const isProfessional = userId ? await userRepo.isProfessional(userId) : false;

        if (!isCron && !isProfessional) {
            return reply.status(403).send({
                status: 'error',
                message: 'Acceso denegado: Se requiere rol de profesional o clave de sistema'
            });
        }

        try {
            const service = new SendWeeklyStats(deps.statsRepo, deps.mailRepo, deps.notificationRepo);
            const totalProcessed = await service.execute();
            return reply.status(200).send({ status: 'success', processed: totalProcessed });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ status: 'error', message: 'Error en el proceso masivo' });
        }
    };
}