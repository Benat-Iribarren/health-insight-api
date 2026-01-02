import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';

import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';
import { authenticate } from '@src/identity/infrastructure/http/authenticate';
import { verifyProfessional } from '@src/identity/infrastructure/http/verifyProfessional';

import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SmtpMailRepository } from '@src/messaging/infrastructure/smtp/SmtpMailRepository';

export function registerRoutes(fastify: FastifyInstance) {
    const userRepository = new SupabaseUserRepository(supabaseClient);
    const mailRepo = new SmtpMailRepository();
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);

    const isProfessional = verifyProfessional(userRepository);

    fastify.register(async (app) => {
        app.addHook('preHandler', authenticate);
        app.addHook('preHandler', isProfessional);

        app.register(
            sendToPatient({
                patientContactRepo,
                mailRepo,
            })
        );
    });
}