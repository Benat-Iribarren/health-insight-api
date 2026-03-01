import { FastifyInstance } from 'fastify';
import { StatsRepository } from '../../../domain/interfaces/StatsRepository';
import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { WeeklyDashboardImageGenerator } from '../../../domain/interfaces/WeeklyDashboardImageGenerator';
import { MailTemplateProvider } from '../../../domain/interfaces/MailTemplateProvider';
import { MailRepository } from '../../../domain/interfaces/MailRepository';
import { SendWeeklyStatsService } from '../../../application/services/SendWeeklyStatsService';
import { SendWeeklyStatsError } from '../../../application/types/SendWeeklyStatsError';
import { sendWeeklyStatsSchema } from './schema';

export const SEND_WEEKLY_STATS_ENDPOINT = '/messaging/weekly-stats/:patientId?';

type StatusCode = 200 | 400 | 404 | 500;

const statusToCode: Record<SendWeeklyStatsError | 'SUCCESSFUL', StatusCode> = {
    SUCCESSFUL: 200,
    INVALID_INPUT: 400,
    NO_EMAIL: 404,
    OPERATION_FAILED: 500,
};

const statusToMessage: Record<SendWeeklyStatsError, { error: string }> = {
    INVALID_INPUT: { error: 'Invalid input' },
    NO_EMAIL: { error: 'No email found' },
    OPERATION_FAILED: { error: 'Internal server error' },
};

interface WeeklyDependencies {
    statsRepo: StatsRepository;
    patientContactRepo: PatientContactRepository;
    imageGenerator: WeeklyDashboardImageGenerator;
    templateProvider: MailTemplateProvider;
    mailRepo: MailRepository;
}

function sendWeeklyStats(deps: WeeklyDependencies) {
    return async function (fastify: FastifyInstance) {
        const useCase = new SendWeeklyStatsService(
            deps.statsRepo,
            deps.patientContactRepo,
            deps.imageGenerator,
            deps.templateProvider,
            deps.mailRepo
        );

        fastify.post(SEND_WEEKLY_STATS_ENDPOINT, sendWeeklyStatsSchema, async (request, reply) => {
            const { patientId: rawId } = request.params as { patientId?: string };
            const patientId = rawId ? Number(rawId) : undefined;

            if (rawId !== undefined && (Number.isNaN(patientId as number) || (patientId as number) <= 0)) {
                return reply.status(statusToCode.INVALID_INPUT).send(statusToMessage.INVALID_INPUT);
            }

            const result = await useCase.execute({ patientId });

            if (typeof result === 'string') return reply.status(statusToCode[result]).send(statusToMessage[result]);
            return reply.status(statusToCode.SUCCESSFUL).send(result);
        });
    };
}

export default sendWeeklyStats;
