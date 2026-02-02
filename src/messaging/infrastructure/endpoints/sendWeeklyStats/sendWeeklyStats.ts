import { FastifyInstance } from 'fastify';
import { StatsRepository } from '../../../domain/interfaces/StatsRepository';
import { MailRepository } from '../../../domain/interfaces/MailRepository';
import { NotificationRepository } from '../../../domain/interfaces/NotificationRepository';
import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { MailTemplateProvider } from '../../../domain/interfaces/MailTemplateProvider';
import { WeeklyDashboardImageGenerator } from '../../../domain/interfaces/WeeklyDashboardImageGenerator';
import { processSendWeeklyStatsService } from '../../../application/services/SendWeeklyStatsService';
import { SendWeeklyStatsError } from '../../../application/types/SendWeeklyStatsError';
import { sendWeeklyStatsSchema } from './schema';

export const SEND_WEEKLY_STATS_ENDPOINT = '/messaging/send-weekly-stats/:patientId?';

type StatusCode = 200 | 202 | 400 | 404 | 500;

const statusToCode: Record<SendWeeklyStatsError | 'INVALID_PATIENT_ID' | 'SUCCESSFUL' | 'ACCEPTED', StatusCode> = {
    SUCCESSFUL: 200,
    ACCEPTED: 202,
    INVALID_PATIENT_ID: 400,
    NO_DATA: 404,
    SEND_FAILED: 500,
};

const statusToMessage: Record<SendWeeklyStatsError | 'INVALID_PATIENT_ID', { error: string }> = {
    INVALID_PATIENT_ID: { error: 'The provided patient ID is invalid.' },
    NO_DATA: { error: 'No data found to send weekly stats.' },
    SEND_FAILED: { error: 'An error occurred while sending weekly stats.' },
};

interface SendWeeklyStatsDependencies {
    statsRepo: StatsRepository;
    mailRepo: MailRepository;
    notificationRepo: NotificationRepository;
    patientContactRepo: PatientContactRepository;
    templateProvider: MailTemplateProvider;
    imageGenerator: WeeklyDashboardImageGenerator;
}

function sendWeeklyStats(dependencies: SendWeeklyStatsDependencies) {
    return async function (fastify: FastifyInstance) {
        fastify.post(SEND_WEEKLY_STATS_ENDPOINT, sendWeeklyStatsSchema, async (request, reply) => {
            try {
                const { patientId: rawId } = request.params as { patientId?: string };
                const patientId = rawId ? Number(rawId) : undefined;

                if (isInvalidPatientId(rawId, patientId)) {
                    return reply.status(statusToCode.INVALID_PATIENT_ID).send(statusToMessage.INVALID_PATIENT_ID);
                }

                if ((request as any).auth?.userId === 'cron') {
                    // TODO: FIRE AND FORGET - Si es ejecución por cron, procesar en background y responder 202 Accepted
                    processSendWeeklyStatsService(
                        dependencies.statsRepo,
                        dependencies.mailRepo,
                        dependencies.notificationRepo,
                        dependencies.patientContactRepo,
                        dependencies.templateProvider,
                        dependencies.imageGenerator,
                        patientId
                    ).catch(err => fastify.log.error(err));

                    return reply.status(statusToCode.ACCEPTED).send({
                        message: 'Weekly health reports processing started in background',
                        data: { sentAt: new Date().toISOString() }
                    });
                }

                const result = await processSendWeeklyStatsService(
                    dependencies.statsRepo,
                    dependencies.mailRepo,
                    dependencies.notificationRepo,
                    dependencies.patientContactRepo,
                    dependencies.templateProvider,
                    dependencies.imageGenerator,
                    patientId
                );

                if (result.status !== 'SUCCESSFUL') {
                    return reply.status(statusToCode[result.status]).send(statusToMessage[result.status]);
                }

                return reply.status(statusToCode.SUCCESSFUL).send({
                    message: 'Weekly health reports processed successfully',
                    data: {
                        processedRecipients: result.processedCount,
                        sentAt: new Date().toISOString()
                    }
                });
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        });
    };
}

function isInvalidPatientId(rawId: string | undefined, patientId: number | undefined): boolean {
    return rawId !== undefined && (Number.isNaN(patientId as number) || (patientId as number) <= 0);
}

export default sendWeeklyStats;