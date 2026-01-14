import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { GmailApiMailRepository } from "@src/messaging/infrastructure/smtp/GmailApiMailRepository";
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/SupabaseStatsRepository';

import presenceMinute from '@src/biometrics/infrastructure/endpoints/presenceMinute';

import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats';

export function registerRoutes(fastify: FastifyInstance) {
    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const mailRepo = new GmailApiMailRepository();

    fastify.get('/ping', async () => {
        return { status: 'ok' };
    });

    // 2. Registra el endpoint de presencia aquí.
    // Al estar fuera de 'professionalApp', permites que los pacientes (autenticados)
    // puedan enviar su heartbeat minutal.
    fastify.register(presenceMinute());

    fastify.register(async (authenticatedApp) => {
        // Los endpoints dentro de professionalApp requieren verificación extra
        authenticatedApp.register(async (professionalApp) => {
            professionalApp.register(
                sendToPatient({
                    patientContactRepo,
                    mailRepo,
                })
            );

            professionalApp.register(
                sendWeeklyStats({
                    statsRepo,
                    mailRepo,
                })
            );
        });
    });
}