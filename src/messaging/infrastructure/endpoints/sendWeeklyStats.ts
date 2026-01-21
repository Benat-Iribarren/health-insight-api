import { FastifyInstance } from 'fastify';
import { SendWeeklyStats } from '../../application/use-cases/SendWeeklyStats';

export default function sendWeeklyStats(deps: any) {
    return async function (fastify: FastifyInstance) {
        const useCase = new SendWeeklyStats(
            deps.statsRepo,
            deps.mailRepo,
            deps.notificationRepo,
            deps.patientContactRepo,
            deps.templateProvider
        );

        fastify.post('/messaging/send-weekly', async (request, reply) => {
            try {
                const { patientId } = request.body as { patientId?: number };
                const processedCount = await useCase.execute(patientId);
                return reply.status(200).send({ status: 'ok', processed: processedCount });
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Error desconocido';
                return reply.status(500).send({ status: 'error', message });
            }
        });
    };
}