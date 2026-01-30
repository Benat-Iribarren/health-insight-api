import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { SupabasePresenceIntervalRepository } from '../../database/SupabasePresenceIntervalRepository';
import { RegisterPresenceMinute } from '../../../application/use-cases/RegisterPresenceMinute';
import { BiometricsError } from '../../../application/types/BiometricsError';
import { presenceMinuteSchema } from './schema';

export const PRESENCE_MINUTE_ENDPOINT = '/presence/minute';

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
    INVALID_INPUT: { error: 'Datos de entrada inválidos' },
    UNAUTHORIZED: { error: 'No autorizado' },
    FORBIDDEN: { error: 'Acceso no permitido' },
    NO_DATA_FOUND: { error: 'No se han encontrado datos' },
    UNKNOWN_ERROR: { error: 'Error interno del servidor' },
};

export default function presenceMinute() {
    return async function (fastify: FastifyInstance) {
        const repository = new SupabasePresenceIntervalRepository(supabaseClient as any);
        const useCase = new RegisterPresenceMinute(repository);

        fastify.post(PRESENCE_MINUTE_ENDPOINT, presenceMinuteSchema, async (request: FastifyRequest, reply: FastifyReply) => {
            const user = (request as any).user;

            const { minuteTsUtc, contextType, sessionId } = request.body as {
                minuteTsUtc?: string;
                contextType: any;
                sessionId?: string | null;
            };

            const result = await useCase.execute({
                patientId: user?.id,
                minuteTsUtc,
                contextType,
                sessionId: sessionId ?? null,
            });

            if (typeof result === 'string') {
                return reply.status(statusToCode[result]).send(statusToMessage[result]);
            }

            return reply.status(statusToCode.SUCCESSFUL).send({
                status: 'ok',
                action: result.action,
                intervalId: result.intervalId,
                message: 'Presencia registrada correctamente',
            });
        });
    };
}
