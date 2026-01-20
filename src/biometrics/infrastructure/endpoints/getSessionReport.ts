import { FastifyInstance } from 'fastify';
import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';
import { GetUnifiedSessionReport } from '../../application/use-cases/GetUnifiedSessionReport';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';

export default function getSessionReport() {
    return async (fastify: FastifyInstance) => {
        const repository = new SupabaseSessionMetricsRepository(supabaseClient);
        const useCase = new GetUnifiedSessionReport(repository);

        fastify.get('/reports/:patientId/:sessionId?', async (request, reply) => {
            try {
                const { patientId, sessionId } = request.params as any;
                const result = await useCase.execute(Number(patientId), sessionId);

                if (!result || (Array.isArray(result) && result.length === 0)) {
                    return reply.status(404).send({ status: 'error', message: 'NO_DATA_FOUND' });
                }

                return reply.status(200).send(result);
            } catch (e: any) {
                if (e.message === 'SESSION_NOT_FOUND') {
                    return reply.status(404).send({ status: 'error', message: 'NO_DATA_FOUND' });
                }
                return reply.status(500).send({ status: 'error', message: e.message });
            }
        });
    };
}