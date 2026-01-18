import { FastifyInstance } from 'fastify';
import { GetUnifiedSessionReport } from '../../application/use-cases/GetUnifiedSessionReport';
import { SupabaseSessionMetricsRepository } from '../database/SupabaseSessionMetricsRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

export default function getSessionReport() {
    const repo = new SupabaseSessionMetricsRepository(supabaseClient);
    const useCase = new GetUnifiedSessionReport(repo);

    return async function (fastify: FastifyInstance) {
        fastify.get('/sessions/:userId/:patientId/:sessionId/report', async (request, reply) => {
            try {
                const { userId, patientId, sessionId } = request.params as any;

                const report = await useCase.execute(userId, Number(patientId), sessionId);

                return reply.status(200).send(report);
            } catch (e: any) {
                const msg = e.message;
                const code = msg === 'SESSION_NOT_FOUND' || msg === 'NO_INTERVALS_FOUND' ? 404 : 500;
                return reply.status(code).send({ status: 'error', message: msg });
            }
        });
    };
}