import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { authenticate } from '@src/identity/infrastructure/http/authenticate';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import { verifyProfessional, verifyPatient } from '@src/identity/infrastructure/http/verifyUser';

import presenceMinute from '@src/biometrics/infrastructure/endpoints/presenceMinute';
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

    const skipAuth = process.env.SKIP_AUTH === 'true';

    // Configuración para el bloque de profesionales (Comentada para pruebas)
    // const professionalConfig = {
    //     preHandler: skipAuth ? [] : [authenticate, verifyProfessional(userRepo)]
    // };

    const patientConfig = {
        preHandler: skipAuth ? [] : [authenticate, verifyPatient(userRepo)]
    };

    fastify.get('/ping', async () => {
        return { status: 'ok' };
    });

    fastify.register(presenceMinute());

    // Bloque Profesional: Registro sin configuración de seguridad activa para pruebas
    fastify.register(async (professionalApp) => {
        // professionalApp.addHook('preHandler', authenticate);

        professionalApp.register(predictDropout({ dropoutRepo }));

        professionalApp.register(sendToPatient({
            patientContactRepo,
            mailRepo,
            notificationRepo
        }));

        professionalApp.register(sendWeeklyStats({
            statsRepo,
            mailRepo,
            notificationRepo
        }));
    } /*, professionalConfig */);

    // Bloque Paciente: Mantiene su configuración de seguridad activa
    fastify.register(async (patientApp) => {
        patientApp.register(patientNotifications({
            notificationRepo
        }));
    }, patientConfig);
}