import { FastifyInstance } from 'fastify';
import { SendWeeklyStats } from '../../application/use-cases/SendWeeklyStats';
import { MESSAGING_RESPONSES } from '@src/messaging/domain/responses/MessagingResponses';

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
                await useCase.execute(patientId);

                const res = MESSAGING_RESPONSES.SUCCESS.WEEKLY_STATS_SENT;
                return reply.status(res.status).send({ message: res.message });
            } catch {
                const err = MESSAGING_RESPONSES.ERRORS.UNKNOWN_ERROR;
                return reply.status(err.status).send({ message: err.message });
            }
        });
    };
}
