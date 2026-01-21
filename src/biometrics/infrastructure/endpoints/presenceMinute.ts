import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { RegisterPresenceMinute } from '../../application/use-cases/RegisterPresenceMinute';

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

                return reply.status(200).send({
                    status: 'ok',
                    action,
                    intervalId: (data as any).id
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                const code = msg === 'Unauthorized' ? 401 : 500;
                return reply.status(code).send({ status: 'error', message: msg });
            }
        });
    };
}