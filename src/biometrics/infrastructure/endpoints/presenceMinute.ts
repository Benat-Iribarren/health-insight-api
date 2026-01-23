import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RegisterPresenceMinute } from '../../application/use-cases/RegisterPresenceMinute';
import { BIOMETRICS_RESPONSES } from '@src/biometrics/domain/responses/BiometricsResponses';

const send = (reply: FastifyReply, err: { status: number; message: string }) =>
    reply.status(err.status).send({ status: 'error', message: err.message });

export default function presenceMinute() {
    return async function (fastify: FastifyInstance) {
        const useCase = new RegisterPresenceMinute();

        fastify.post('/presence/minute', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const user = (request as any).user;

                const { minuteTsUtc, contextType, sessionId } = request.body as {
                    minuteTsUtc: string;
                    contextType: any;
                    sessionId?: string;
                };

                const { data, action } = await useCase.execute({
                    patientId: user.id,
                    minuteTsUtc,
                    contextType,
                    sessionId: sessionId ?? null
                });

                const res = BIOMETRICS_RESPONSES.SUCCESS.PRESENCE_RECORDED;
                return reply.status(res.status).send({
                    status: 'ok',
                    action,
                    intervalId: (data as any).id,
                    message: res.message
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : null;

                if (msg === BIOMETRICS_RESPONSES.ERRORS.UNAUTHORIZED.message) {
                    const err = BIOMETRICS_RESPONSES.ERRORS.UNAUTHORIZED;
                    return send(reply, err);
                }

                const err = BIOMETRICS_RESPONSES.ERRORS.UNKNOWN_ERROR;
                return send(reply, err);
            }
        });
    };
}
