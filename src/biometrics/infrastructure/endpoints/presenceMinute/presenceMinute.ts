import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { SupabasePresenceIntervalRepository } from '../../database/SupabasePresenceIntervalRepository';
import { RegisterPresenceMinuteService } from '@src/biometrics/application/services/RegisterPresenceMinuteService';
import { BiometricsError } from '../../../application/types/BiometricsError';
import { presenceMinuteSchema } from './schema';

export const PRESENCE_MINUTE_ENDPOINT = '/presence/minute';

type PresenceBody = {
    minuteTsUtc?: string;
    contextType: 'dashboard' | 'session';
    sessionId?: number | null;
};

const statusToCode: Record<BiometricsError | 'SUCCESSFUL', number> = {
    SUCCESSFUL: 200,
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

export default function presenceMinute() {
    return async function (fastify: FastifyInstance) {
        const repository = new SupabasePresenceIntervalRepository(supabaseClient);
        const useCase = new RegisterPresenceMinuteService(repository);

        fastify.post<{ Body: PresenceBody }>(
            PRESENCE_MINUTE_ENDPOINT,
            presenceMinuteSchema,
            async (request: FastifyRequest<{ Body: PresenceBody }>, reply: FastifyReply) => {
                const auth = request.auth;

                if (!auth?.patientId) {
                    return reply.status(statusToCode.UNAUTHORIZED).send(statusToMessage.UNAUTHORIZED);
                }

                const { minuteTsUtc, contextType, sessionId } = request.body;

                const result = await useCase.execute({
                    patientId: auth.patientId,
                    minuteTsUtc,
                    contextType,
                    sessionId: sessionId ?? null,
                });

                if (typeof result === 'string') {
                    return reply.status(statusToCode[result]).send(statusToMessage[result]);
                }

                return reply.status(statusToCode.SUCCESSFUL).send({
                    action: result.action,
                    intervalId: result.intervalId,
                    message: 'Presence registered successfully',
                });
            }
        );
    };
}