import { FastifyInstance, FastifyReply } from 'fastify';
import { GetUnifiedSessionReportService } from '@src/biometrics/application/services/GetUnifiedSessionReportService';
import { SupabaseSessionMetricsRepository } from '../../database/SupabaseSessionMetricsRepository';
import { BiometricsError } from '../../../application/types/BiometricsError';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<BiometricsError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_INPUT: 400,
    NO_DATA_FOUND: 404,
    UNKNOWN_ERROR: 500,
};

const statusToMessage: Record<BiometricsError, { error: string }> = {
    INVALID_INPUT: { error: 'Invalid input' },
    NO_DATA_FOUND: { error: 'No data found' },
    UNKNOWN_ERROR: { error: 'Internal server error' },
};

interface GetSessionReportDependencies {
    sessionMetricsRepo: SupabaseSessionMetricsRepository;
}

export default function getSessionReport(deps: GetSessionReportDependencies) {
    return async function (fastify: FastifyInstance) {
        const useCase = new GetUnifiedSessionReportService(deps.sessionMetricsRepo);

        fastify.get('/reports/:patientId/:sessionId?', async (request, reply: FastifyReply) => {
            try {
                const { patientId, sessionId } = request.params as {
                    patientId: string;
                    sessionId?: string;
                };

                const { page, limit } = request.query as {
                    page?: string;
                    limit?: string;
                };

                const pid = Number(patientId);
                if (!pid || Number.isNaN(pid)) {
                    return reply
                        .status(statusToCode.INVALID_INPUT)
                        .send(statusToMessage.INVALID_INPUT);
                }

                const p = Number(page) || 1;
                const l = Number(limit) || 10;

                const result = await useCase.execute(pid, sessionId, p, l);

                if (typeof result === 'string') {
                    return reply
                        .status(statusToCode[result])
                        .send(statusToMessage[result]);
                }

                return reply.status(statusToCode.SUCCESSFUL).send(result);
            } catch {
                return reply
                    .status(statusToCode.UNKNOWN_ERROR)
                    .send(statusToMessage.UNKNOWN_ERROR);
            }
        });
    };
}