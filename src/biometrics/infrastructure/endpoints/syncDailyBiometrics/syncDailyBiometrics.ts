import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SyncDailyBiometricsService } from '@src/biometrics/application/services/SyncDailyBiometricsService';
import { BiometricsFileSource } from '../../../domain/interfaces/BiometricsFileSource';
import { BiometricMinutesRepository } from '../../../domain/interfaces/BiometricMinutesRepository';
import { BiometricsError } from '../../../application/types/BiometricsError';
import { syncDailyBiometricsSchema } from './schema';

export const SYNC_DAILY_BIOMETRICS_ENDPOINT = '/biometrics/sync-daily';

type StatusCode = 200 | 202 | 400 | 401 | 403 | 404 | 500;

const statusToCode: Record<BiometricsError | 'SUCCESSFUL' | 'ACCEPTED', StatusCode> = {
    SUCCESSFUL: 200,
    ACCEPTED: 202,
    INVALID_INPUT: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NO_DATA_FOUND: 404,
    UNKNOWN_ERROR: 500,
};

const statusToMessage: Record<BiometricsError, { error: string }> = {
    INVALID_INPUT: { error: 'Invalid input data' },
    UNAUTHORIZED: { error: 'Unauthorized access' },
    FORBIDDEN: { error: 'Forbidden access' },
    NO_DATA_FOUND: { error: 'No data found' },
    UNKNOWN_ERROR: { error: 'Internal server error' },
};

type SyncDailyBiometricsDependencies = {
    source: BiometricsFileSource;
    biometricsRepo: BiometricMinutesRepository;
};

function resolveTargetDate(date?: string): string {
    if (date) return date;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

export default function syncDailyBiometrics(deps: SyncDailyBiometricsDependencies) {
    return async function (fastify: FastifyInstance) {
        const useCase = new SyncDailyBiometricsService(deps.source, deps.biometricsRepo);

        fastify.post(
            SYNC_DAILY_BIOMETRICS_ENDPOINT,
            syncDailyBiometricsSchema,
            async (request: FastifyRequest, reply: FastifyReply) => {
                const { date } = request.body as { date?: string };
                const targetDate = resolveTargetDate(date);

                if ((request as any).auth?.userId === 'cron') {
                    useCase.execute(targetDate).catch(err => fastify.log.error(err));
                    return reply.status(statusToCode.ACCEPTED).send({
                        targetDate,
                        message: 'Synchronization task accepted',
                    });
                }

                const result = await useCase.execute(targetDate);

                if (typeof result === 'string') {
                    return reply.status(statusToCode[result]).send(statusToMessage[result]);
                }

                return reply.status(statusToCode.SUCCESSFUL).send(result);
            }
        );
    };
}