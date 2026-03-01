import { FastifyInstance, FastifyReply } from 'fastify';
import { GetUnifiedSessionReportService } from '@src/biometrics/application/services/GetUnifiedSessionReportService';
import { BiometricsError } from '../../../application/types/BiometricsError';
import { getSessionReportSchema } from './schema';
import { BiometricSample } from '../../../domain/models/BiometricSample';
import { UnifiedSessionReport } from '../../../domain/models/UnifiedSessionReport';
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

type BiometricDetailDto = {
    timestampIso: string;
    timestampUnixMs: number;
    pulseRateBpm: number | null;
    edaSclUsiemens: number | null;
    temperatureCelsius: number | null;
    accelStdG: number | null;
    respiratoryRateBrpm: number | null;
    bodyPositionType: string | null;
};

type UnifiedSessionReportDto = Omit<UnifiedSessionReport, 'objectiveAnalysis'> & {
    objectiveAnalysis: {
        summary: UnifiedSessionReport['objectiveAnalysis']['summary'];
        biometricDetails: BiometricDetailDto[];
    };
};

function mapBiometricDetailDto(b: BiometricSample): BiometricDetailDto {
    return {
        timestampIso: b.timestamp.toISOString(),
        timestampUnixMs: b.timestamp.getTime(),
        pulseRateBpm: b.pulseRateBpm,
        edaSclUsiemens: b.edaSclUsiemens,
        temperatureCelsius: b.temperatureCelsius,
        accelStdG: b.accelStdG,
        respiratoryRateBrpm: b.respiratoryRateBrpm,
        bodyPositionType: b.bodyPositionType,
    };
}

function mapUnifiedSessionReportDto(r: UnifiedSessionReport): UnifiedSessionReportDto {
    return {
        sessionId: r.sessionId,
        state: r.state,
        dizzinessPercentage: r.dizzinessPercentage,
        noBiometrics: r.noBiometrics,
        subjectiveAnalysis: r.subjectiveAnalysis,
        objectiveAnalysis: {
            summary: r.objectiveAnalysis.summary,
            biometricDetails: r.objectiveAnalysis.biometricDetails.map(mapBiometricDetailDto),
        },
    };
}

export const GET_SESSION_REPORT_ENDPOINT = '/biometrics/session-report/:patientId/:sessionId?';

type GetSessionReportDeps = { sessionMetricsRepo: SessionMetricsRepository };

export default function getSessionReport(deps: GetSessionReportDeps) {
    return async function (fastify: FastifyInstance) {
        const useCase = new GetUnifiedSessionReportService(deps.sessionMetricsRepo);

        fastify.get(GET_SESSION_REPORT_ENDPOINT, getSessionReportSchema, async (request: any, reply: FastifyReply) => {
            const { patientId, sessionId } = request.params as { patientId: string; sessionId?: string };
            const { page, limit } = request.query as { page?: string; limit?: string };

            const pId = Number(patientId);
            if (Number.isNaN(pId) || pId <= 0) return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);

            const pg = page ? Number(page) : 1;
            const lm = limit ? Number(limit) : 10;

            if (!Number.isFinite(pg) || pg <= 0) return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);
            if (!Number.isFinite(lm) || lm <= 0) return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);

            const result = await useCase.execute(pId, sessionId, pg, lm);

            if (typeof result === 'string') {
                return reply.status(statusToCode[result]).send(statusToMessage[result]);
            }

            const mapped = Array.isArray(result.data)
                ? result.data.map(mapUnifiedSessionReportDto)
                : mapUnifiedSessionReportDto(result.data);

            return reply.status(statusToCode.SUCCESSFUL).send({ data: mapped, meta: result.meta });
        });
    };
}