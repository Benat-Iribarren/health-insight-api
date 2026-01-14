import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { authenticate } from '@src/identity/infrastructure/http/authenticate';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import { verifyProfessional } from '@src/identity/infrastructure/http/verifyUser';

import presenceMinute from '@src/biometrics/infrastructure/endpoints/presenceMinute';
import predictDropout from '@src/clinical-intelligence/infrastructure/endpoints/predictDropout';
import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats';

import { SupabaseDropoutRepository } from '@src/clinical-intelligence/infrastructure/database/SupabaseDropoutRepository';
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/SupabaseStatsRepository';
import { GmailApiMailRepository } from "@src/messaging/infrastructure/smtp/GmailApiMailRepository";

export function registerRoutes(fastify: FastifyInstance) {
    const userRepo = new SupabaseUserRepository(supabaseClient);
    const dropoutRepo = new SupabaseDropoutRepository(supabaseClient as any);
    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const mailRepo = new GmailApiMailRepository();

    const isAuth = { preHandler: [authenticate] };
    const isProfessional = { preHandler: [authenticate, verifyProfessional(userRepo)] };

    fastify.get('/ping', async () => {
        return { status: 'ok' };
    });

    fastify.register(presenceMinute());

    fastify.register(async (professionalApp) => {
        // professionalApp.addHook('preHandler', authenticate);

        professionalApp.register(predictDropout({ dropoutRepo }), isProfessional);

        professionalApp.register(sendToPatient({
            patientContactRepo,
            mailRepo
        }), isProfessional);

        professionalApp.register(sendWeeklyStats({
            statsRepo,
            mailRepo
        }), isProfessional);
    });
}