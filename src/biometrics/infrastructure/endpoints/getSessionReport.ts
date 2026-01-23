import { FastifyInstance, FastifyReply } from 'fastify';
import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';
import { GetUnifiedSessionReport } from '../../application/use-cases/GetUnifiedSessionReport';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { BIOMETRICS_RESPONSES } from '@src/biometrics/domain/responses/BiometricsResponses';

const send = (reply: FastifyReply, err: { status: number; message: string }) =>
    reply.status(err.status).send({ status: 'error', message: err.message });

export default function getSessionReport() {
    return async (fastify: FastifyInstance) => {
        const repository = new SupabaseSessionMetricsRepository(supabaseClient);
        const useCase = new GetUnifiedSessionReport(repository);

        fastify.get('/reports/:patientId/:sessionId?', async (request, reply) => {
            try {
                const { patientId, sessionId } = request.params as any;

                const result = await useCase.execute(Number(patientId), sessionId);

                if (!result || (Array.isArray(result) && result.length === 0)) {
                    const err = BIOMETRICS_RESPONSES.ERRORS.NO_DATA_FOUND;
                    return send(reply, err);
                }

                const res = BIOMETRICS_RESPONSES.SUCCESS.OK;
                return reply.status(res.status).send(result);
            } catch (e: any) {
                if (e?.message === 'SESSION_NOT_FOUND') {
                    const err = BIOMETRICS_RESPONSES.ERRORS.NO_DATA_FOUND;
                    return send(reply, err);
                }

                const err = BIOMETRICS_RESPONSES.ERRORS.UNKNOWN_ERROR;
                return send(reply, err);
            }
        });
    };
}
