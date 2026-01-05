import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import { authenticate } from '@src/identity/infrastructure/http/authenticate';
import {
    verifyProfessional,
    verifyPatient
} from '@src/identity/infrastructure/http/verifyUser';
import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats';
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SmtpMailRepository } from '@src/messaging/infrastructure/smtp/SmtpMailRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/SupabaseStatsRepository';
import { HtmlImageGenerator } from "@src/messaging/infrastructure/images/HtmlImageGenerator";

export function registerRoutes(fastify: FastifyInstance) {
    const userRepository = new SupabaseUserRepository(supabaseClient);
    const mailRepo = new SmtpMailRepository();
    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const imageGen = new HtmlImageGenerator();

    const isProfessional = verifyProfessional(userRepository);
    const isPatient = verifyPatient(userRepository);

    fastify.get('/ping', async () => {
        return { status: 'ok' };
    });

    fastify.register(async (authenticatedApp) => {
        // authenticatedApp.addHook('preHandler', authenticate);

        authenticatedApp.register(async (professionalApp) => {
            // professionalApp.addHook('preHandler', isProfessional);

            professionalApp.register(
                sendToPatient({
                    patientContactRepo,
                    mailRepo,
                })
            );

            professionalApp.register(async (statsApp) => {
                // statsApp.addHook('preHandler', isProfessional);
                statsApp.register(
                    sendWeeklyStats({
                        imageGen,
                        statsRepo,
                        mailRepo,
                    })
                );
            });
        });

        authenticatedApp.register(async (patientApp) => {
            // patientApp.addHook('preHandler', isPatient);
        });
    });
}