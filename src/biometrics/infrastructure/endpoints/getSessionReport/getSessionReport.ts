import { FastifyInstance, FastifyReply } from 'fastify';
import { GetUnifiedSessionReportService } from '@src/biometrics/application/services/GetUnifiedSessionReportService';
import { BiometricsError } from '../../../application/types/BiometricsError';
import { getSessionReportSchema } from './schema';
import { SessionMetricsRepository } from '../../../domain/interfaces/SessionMetricsRepository';

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

export const GET_SESSION_REPORT_ENDPOINT = '/biometrics/session-report/:patientId/:sessionId?';

type GetSessionReportDeps = { sessionMetricsRepo: SessionMetricsRepository };

export default function getSessionReport(deps: GetSessionReportDeps) {
    return async function (fastify: FastifyInstance) {
        const useCase = new GetUnifiedSessionReportService(deps.sessionMetricsRepo);

        fastify.get(GET_SESSION_REPORT_ENDPOINT, getSessionReportSchema, async (request: any, reply: FastifyReply) => {
            const { patientId, sessionId } = request.params as { patientId: string; sessionId?: string };
            const { page, limit } = request.query as { page?: string; limit?: string };

            const pId = Number(patientId);
            if (isNaN(pId) || pId <= 0) {
                return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);
            }

            const pg = page ? Number(page) : 1;
            const lm = limit ? Number(limit) : 10;

            if (isNaN(pg) || pg <= 0 || isNaN(lm) || lm <= 0) {
                return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);
            }

            const result = await useCase.execute(pId, sessionId, pg, lm);

            if (typeof result === 'string') {
                return reply.status(statusToCode[result]).send(statusToMessage[result]);
            }

            return reply.status(statusToCode.SUCCESSFUL).send({
                data: result.data,
                meta: {
                    total: Number(result.meta.total),
                    page: Number(result.meta.page),
                    limit: Number(result.meta.limit)
                }
            });
        });
    };
}