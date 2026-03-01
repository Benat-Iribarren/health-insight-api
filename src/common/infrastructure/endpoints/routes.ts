import { FastifyInstance } from 'fastify';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import { verifyHybridAccess, verifyPatient, verifyProfessional } from '@src/identity/infrastructure/middlewares/IdentityMiddlewares';

import presenceMinute from '@src/biometrics/infrastructure/endpoints/presenceMinute/presenceMinute';
import syncDailyBiometrics from '@src/biometrics/infrastructure/endpoints/syncDailyBiometrics/syncDailyBiometrics';
import getSessionReport from '@src/biometrics/infrastructure/endpoints/getSessionReport/getSessionReport';

import predictDropout from '@src/clinical-intelligence/infrastructure/endpoints/predictDropout/predictDropout';
import { SupabaseDropoutRepository } from '@src/clinical-intelligence/infrastructure/database/repositories/SupabaseDropoutRepository';
import { SupabaseSessionMetricsRepository } from '@src/biometrics/infrastructure/database/repositories/SupabaseSessionMetricsRepository';
import { SupabaseBiometricMinutesRepository } from '@src/biometrics/infrastructure/database/repositories/SupabaseBiometricMinutesRepository';

import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats/sendWeeklyStats';
import patientNotifications from '@src/messaging/infrastructure/endpoints/patientNotifications/patientNotifications';

import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/repositories/SupabasePatientContactRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/repositories/SupabaseStatsRepository';
import { SupabaseNotificationRepository } from '@src/messaging/infrastructure/database/repositories/SupabaseNotificationRepository';
import { SupabaseResponseRepository } from '@src/messaging/infrastructure/database/repositories/SupabaseResponseRepository';

import { GmailApiMailRepository } from '@src/messaging/infrastructure/gmail/GmailApiMailRepository';
import { HtmlMailTemplateProvider } from '@src/messaging/infrastructure/templates/HtmlMailTemplateProvider';
import { HtmlImageGenerator } from '@src/messaging/infrastructure/images/HtmlImageGenerator';

import { EmpaticaS3FileSource } from '@src/biometrics/infrastructure/aws/EmpaticaS3FileSource';

import respond from '@src/messaging/infrastructure/endpoints/respond/respond';
import patientResponses from '@src/messaging/infrastructure/endpoints/patientResponses/patientResponses';

export function registerRoutes(fastify: FastifyInstance) {
    const userRepo = new SupabaseUserRepository(supabaseClient);

    const dropoutRepo = new SupabaseDropoutRepository(supabaseClient);

    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const notificationRepo = new SupabaseNotificationRepository(supabaseClient);
    const responseRepo = new SupabaseResponseRepository(supabaseClient);

    const biometricsRepo = new SupabaseBiometricMinutesRepository(supabaseClient);
    const sessionMetricsRepo = new SupabaseSessionMetricsRepository(supabaseClient);

    const biometricsSource = new EmpaticaS3FileSource({
        region: 'us-east-1',
        bucket: 'empatica-us-east-1-prod-data',
        prefix: 'v2/451/1/1/participant_data/',
        accessKeyId: process.env.EMPATICA_AWS_ACCESS_KEY ?? '',
        secretAccessKey: process.env.EMPATICA_AWS_SECRET_KEY ?? '',
    });

    const mailRepo = new GmailApiMailRepository();
    const templateProvider = new HtmlMailTemplateProvider();
    const imageGenerator = new HtmlImageGenerator(statsRepo);

    const messagingDeps = {
        statsRepo,
        mailRepo,
        notificationRepo,
        patientContactRepo,
        templateProvider,
        imageGenerator,
    };

    fastify.get('/ping', async () => ({ status: 'ok' }));

    fastify.register(async (hybridContext) => {
        hybridContext.addHook('preHandler', verifyHybridAccess(userRepo));
        hybridContext.register(sendWeeklyStats(messagingDeps));
        hybridContext.register(syncDailyBiometrics({ biometricsRepo, source: biometricsSource }));
    });

    fastify.register(async (professionalApp) => {
        professionalApp.addHook('preHandler', verifyProfessional(userRepo));
        professionalApp.register(predictDropout({ dropoutRepo }));
        professionalApp.register(sendToPatient(messagingDeps));
        professionalApp.register(getSessionReport({ sessionMetricsRepo }));
        professionalApp.register(patientResponses({ responseRepo, notificationRepo }));
    });

    fastify.register(async (patientApp) => {
        patientApp.addHook('preHandler', verifyPatient(userRepo));
        patientApp.register(presenceMinute());
        patientApp.register(patientNotifications({ notificationRepo }));
        patientApp.register(
            respond({
                notificationRepo,
                responseRepo,
            })
        );
    });
}