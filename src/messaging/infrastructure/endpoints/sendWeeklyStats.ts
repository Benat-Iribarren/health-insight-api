import { FastifyInstance } from 'fastify';
import { SendWeeklyStats } from '../../application/SendWeeklyStats';
import { StatsRepository } from '../../domain/interfaces/StatsRepository';
import { MailRepository } from '../../domain/interfaces/MailRepository';
import { HtmlImageGenerator } from '../images/HtmlImageGenerator';

interface Dependencies {
    statsRepo: StatsRepository;
    mailRepo: MailRepository;
    imageGen: HtmlImageGenerator;
}

export default function sendWeeklyStats(deps: Dependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.post('/messaging/send-weekly-stats', async (request, reply) => {
            try {
                const service = new SendWeeklyStats(
                    deps.statsRepo,
                    deps.mailRepo,
                    deps.imageGen
                );
                const result = await service.execute();

                return reply.status(200).send({
                    status: 'success',
                    message: `Informes enviados a ${result.processed} pacientes.`
                });
            } catch (error) {
                fastify.log.error(error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        });
    };
}