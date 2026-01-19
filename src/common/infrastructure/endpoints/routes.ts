import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { authenticate } from '@src/identity/infrastructure/http/authenticate';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import { verifyProfessional, verifyPatient } from '@src/identity/infrastructure/http/verifyUser';
import presenceMinute from '@src/biometrics/infrastructure/endpoints/presenceMinute';
import syncDailyBiometrics from '@src/biometrics/infrastructure/endpoints/syncDailyBiometrics';
import getSessionReport from '@src/biometrics/infrastructure/endpoints/getSessionReport';
import predictDropout from '@src/clinical-intelligence/infrastructure/endpoints/predictDropout';
import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats';
import patientNotifications from '@src/messaging/infrastructure/endpoints/patientNotifications';
import { SupabaseDropoutRepository } from '@src/clinical-intelligence/infrastructure/database/SupabaseDropoutRepository';
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/SupabaseStatsRepository';
import { SupabaseNotificationRepository } from '@src/messaging/infrastructure/database/SupabaseNotificationRepository';
import { GmailApiMailRepository } from "@src/messaging/infrastructure/gmail/GmailApiMailRepository";

export function registerRoutes(fastify: FastifyInstance) {
    const userRepo = new SupabaseUserRepository(supabaseClient);
    const dropoutRepo = new SupabaseDropoutRepository(supabaseClient as any);
    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const notificationRepo = new SupabaseNotificationRepository(supabaseClient);
    const mailRepo = new GmailApiMailRepository();
    const deps = { statsRepo, mailRepo, notificationRepo, patientContactRepo, dropoutRepo };

    fastify.get('/ping', async () => ({ status: 'ok' }));

    fastify.post('/biometrics/sync-daily', syncDailyBiometrics);

    fastify.register(presenceMinute());

    fastify.register(async (app) => {
        app.post('/messaging/send-weekly-stats', sendWeeklyStats(deps));

        app.register(async (authContext) => {
            authContext.addHook('preHandler', async (req, res) => {
                try { await authenticate(req, res); } catch (e) { }
            });

            authContext.register(async (professionalApp) => {
                professionalApp.addHook('preHandler', verifyProfessional(userRepo));
                professionalApp.register(predictDropout({ dropoutRepo }));
                professionalApp.register(sendToPatient(deps));
                professionalApp.register(getSessionReport());
            });

            authContext.register(async (patientApp) => {
                patientApp.addHook('preHandler', verifyPatient(userRepo));
                patientApp.register(patientNotifications({ notificationRepo }));
            });
        });
    });
}