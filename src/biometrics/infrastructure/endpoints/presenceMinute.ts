import { FastifyInstance } from 'fastify';
import { RegisterPresenceMinute } from '../../application/use-cases/RegisterPresenceMinute';

export default function presenceMinute() {
    const useCase = new RegisterPresenceMinute();

    return async function (fastify: FastifyInstance) {
        fastify.post('/presence/minute', async (request, reply) => {
            try {
                // Forzamos el UUID que me has pasado para saltarnos el middleware de auth
                const patientId = (request as any).user?.id ?? "f1570f10-415e-480a-9ff1-a9dc777d5cdb";

                const { minuteTsUtc, contextType, sessionId } = request.body as any;

                const { data, action } = await useCase.execute({
                    patientId,
                    minuteTsUtc,
                    contextType,
                    sessionId: sessionId ?? null
                });

                return reply.status(200).send({
                    status: 'ok',
                    action,
                    intervalId: (data as any).id
                });
            } catch (e: any) {
                const msg = e.message;
                const code = msg === 'Unauthorized' ? 401 : (msg.includes('must be') || msg.includes('Invalid') ? 400 : 500);
                return reply.status(code).send({ status: 'error', message: msg });
            }
        });
    };
}