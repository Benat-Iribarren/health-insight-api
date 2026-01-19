import { FastifyInstance } from 'fastify';
import { GetUnifiedSessionReport } from '../../application/use-cases/GetUnifiedSessionReport';
import { SupabaseSessionMetricsRepository } from '../database/SupabaseSessionMetricsRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

export default function getSessionReport() {
    const repo = new SupabaseSessionMetricsRepository(supabaseClient);
    const useCase = new GetUnifiedSessionReport(repo);

    return async function (fastify: FastifyInstance) {
        fastify.get('/reports/:patientId/:sessionId?', async (request, reply) => {
            try {
                const { patientId, sessionId } = request.params as any;
                const report = await useCase.execute(Number(patientId), sessionId);

                if (!report || (Array.isArray(report) && report.length === 0)) {
                    return reply.status(404).send({ status: 'error', message: 'NO_DATA_FOUND' });
                }

                return reply.status(200).send(report);
            } catch (e: any) {
                return reply.status(500).send({ status: 'error', message: e.message });
            }
        });
    };
}