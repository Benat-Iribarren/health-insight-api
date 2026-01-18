import { FastifyInstance } from 'fastify';
import { GetUnifiedSessionReport } from '../../application/use-cases/GetUnifiedSessionReport';
import { SupabaseSessionMetricsRepository } from '../database/SupabaseSessionMetricsRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

export default function getSessionReport() {
    const repo = new SupabaseSessionMetricsRepository(supabaseClient);
    const useCase = new GetUnifiedSessionReport(repo);

    return async function (fastify: FastifyInstance) {
        fastify.get('/sessions/:userId/:patientId/report/:sessionId?', async (request, reply) => {
            try {
                const { userId, patientId, sessionId } = request.params as any;
                const report = await useCase.execute(userId, Number(patientId), sessionId);
                return reply.status(200).send(report);
            } catch (e: any) {
                return reply.status(e.message.includes('NOT_FOUND') ? 404 : 500).send({
                    status: 'error',
                    message: e.message
                });
            }
        });
    };
}