import { FastifyInstance, FastifyReply } from 'fastify';
import { GetUnifiedSessionReportService } from '@src/biometrics/application/services/GetUnifiedSessionReportService';
import { SupabaseSessionMetricsRepository } from '../../database/SupabaseSessionMetricsRepository';
import { BiometricsError } from '../../../application/types/BiometricsError';

type StatusCode = 200 | 400 | 401 | 403 | 404 | 500;

const statusToCode: Record<BiometricsError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_INPUT: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NO_DATA_FOUND: 404,
    UNKNOWN_ERROR: 500,
};

const statusToMessage: Record<BiometricsError, { error: string }> = {
    INVALID_INPUT: { error: 'Invalid input' },
    UNAUTHORIZED: { error: 'Unauthorized' },
    FORBIDDEN: { error: 'Forbidden' },
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

                const pid = Number(patientId);
                if (!pid || Number.isNaN(pid)) {
                    return reply
                        .status(statusToCode.INVALID_INPUT)
                        .send(statusToMessage.INVALID_INPUT);
                }

                const result = await useCase.execute(pid, sessionId);

                if (result === null || (Array.isArray(result) && result.length === 0)) {
                    return reply
                        .status(statusToCode.NO_DATA_FOUND)
                        .send(statusToMessage.NO_DATA_FOUND);
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
