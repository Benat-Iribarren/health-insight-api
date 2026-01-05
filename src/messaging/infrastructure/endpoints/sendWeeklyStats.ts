import { FastifyInstance } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';
import { StatsRepository } from '../../domain/interfaces/StatsRepository';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { HtmlImageGenerator } from '../images/HtmlImageGenerator';
import { MESSAGING_RESPONSES } from '../../domain/MessagingError';

interface Dependencies {
    statsRepo: StatsRepository;
    mailRepo: MailRepository;
    imageGen: HtmlImageGenerator;
}

export default function sendWeeklyStats(deps: Dependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-weekly-stats', async (request, reply) => {
            try {
                const service = new SendWeeklyStats(deps.statsRepo, deps.mailRepo, deps.imageGen);
                const result = await service.execute();

                if ('type' in result) {
                    const errorKey = result.type as keyof typeof MESSAGING_RESPONSES.ERRORS;
                    const errorConfig = MESSAGING_RESPONSES.ERRORS[errorKey];
                    return reply.status(errorConfig.status).send({
                        status: 'error',
                        error: { code: errorConfig.code, message: errorConfig.message }
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