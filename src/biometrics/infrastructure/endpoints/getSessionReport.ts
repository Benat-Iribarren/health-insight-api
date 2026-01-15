import { FastifyInstance } from 'fastify';
import { GetUnifiedSessionReport } from '../../application/use-cases/GetUnifiedSessionReport';
import { SupabaseSessionMetricsRepository } from '../database/SupabaseSessionMetricsRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';

export default function getSessionReport() {
    return async function (fastify: FastifyInstance) {
        const repo = new SupabaseSessionMetricsRepository(supabaseClient);
        const useCase = new GetUnifiedSessionReport(repo);

        fastify.get('/biometrics/session-report/:patientId/:sessionId', async (request, reply) => {
            const { patientId, sessionId } = request.params as any;
            try {
                const report = await useCase.execute(parseInt(patientId), sessionId);
                return reply.status(200).send({ status: 'success', data: report });
            } catch (e: any) {
                return reply.status(500).send({ status: 'error', message: e.message });
            }
        });
    };
}