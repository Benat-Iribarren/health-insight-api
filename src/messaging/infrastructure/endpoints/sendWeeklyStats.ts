import { FastifyInstance } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';
import { MESSAGING_RESPONSES } from '../../domain/MessagingError';

export default function sendWeeklyStats(deps: any) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-weekly-stats', async (request, reply) => {
            try {
                const service = new SendWeeklyStats(deps.statsRepo, deps.outboxRepo);
                const result = await service.execute();

                if ('type' in result) {
                    const errorKey = result.type as keyof typeof MESSAGING_RESPONSES.ERRORS;
                    const errorConfig = MESSAGING_RESPONSES.ERRORS[errorKey];

                    return reply.status(errorConfig?.status || 500).send({
                        status: 'error',
                        error: {
                            code: errorConfig?.code || 'UNKNOWN',
                            message: errorConfig?.message || 'Error'
                        }
                    });
                }

                const successConfig = MESSAGING_RESPONSES.SUCCESS.SEND_WEEKLY_STATS;
                return reply.status(successConfig.code).send({
                    status: successConfig.status,
                    message: successConfig.getMessage(result.processed)
                });
            } catch (error) {
                fastify.log.error(error);
                const internal = MESSAGING_RESPONSES.ERRORS.INTERNAL_ERROR;
                return reply.status(internal.status).send({
                    status: 'error',
                    error: { code: internal.code, message: internal.message }
                });
            }
        });
    };
}