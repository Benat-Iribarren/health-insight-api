import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats';
import predictDropout from '@src/clinical-intelligence/infrastructure/endpoints/predictDropout';
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/SupabaseStatsRepository';
import { GmailApiMailRepository } from "@src/messaging/infrastructure/smtp/GmailApiMailRepository";

export function registerRoutes(fastify: FastifyInstance) {
    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const mailRepo = new GmailApiMailRepository();

    fastify.get('/ping', async () => {
        return { status: 'ok' };
    });

    fastify.register(async (authenticatedApp) => {
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