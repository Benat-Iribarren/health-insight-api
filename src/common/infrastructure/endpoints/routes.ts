import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats';
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SmtpMailRepository } from '@src/messaging/infrastructure/smtp/SmtpMailRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/SupabaseStatsRepository';
import { HtmlImageGenerator } from "@src/messaging/infrastructure/images/HtmlImageGenerator";

import predictDropout from '@src/clinical-intelligence/infrastructure/endpoints/predictDropout';
import { SupabaseDropoutRepository } from '@src/clinical-intelligence/infrastructure/database/SupabaseDropoutRepository';

export function registerRoutes(fastify: FastifyInstance) {
    const userRepository = new SupabaseUserRepository(supabaseClient);
    const mailRepo = new SmtpMailRepository();
    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const imageGen = new HtmlImageGenerator();

    const dropoutRepo = new SupabaseDropoutRepository(supabaseClient);

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
                    imageGen,
                    statsRepo,
                    mailRepo,
                })
            );

            professionalApp.register(
                predictDropout({
                    dropoutRepo
                })
            );
        });
    });
}