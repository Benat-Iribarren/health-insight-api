import { FastifyInstance } from 'fastify';
import { supabaseClient } from '../database/supabaseClient';
import { SupabaseUserRepository } from '@src/identity/infrastructure/database/repositories/SupabaseUserRepository';

// Endpoints
import sendToPatient from '@src/messaging/infrastructure/endpoints/sendToPatient';
import sendWeeklyStats from '@src/messaging/infrastructure/endpoints/sendWeeklyStats';
import predictDropout from '@src/clinical-intelligence/infrastructure/endpoints/predictDropout';

// Repositorios
import { SupabasePatientContactRepository } from '@src/messaging/infrastructure/database/SupabasePatientContactRepository';
import { SupabaseStatsRepository } from '@src/messaging/infrastructure/database/SupabaseStatsRepository';
import { SupabaseOutboxRepository } from '@src/messaging/infrastructure/database/SupabaseOutboxRepository';
import { SupabaseDropoutRepository } from '@src/clinical-intelligence/infrastructure/database/SupabaseDropoutRepository';

export function registerRoutes(fastify: FastifyInstance) {
    const statsRepo = new SupabaseStatsRepository(supabaseClient);
    const patientContactRepo = new SupabasePatientContactRepository(supabaseClient);
    const outboxRepo = new SupabaseOutboxRepository(supabaseClient);
    const dropoutRepo = new SupabaseDropoutRepository(supabaseClient);

    fastify.get('/ping', async () => {
        return { status: 'ok' };
    });

    /**
     * BLOQUE DE AUTENTICACIÓN
     * Este registro actúa como un middleware global para todas las rutas internas.
     * Utiliza un 'preHandler' para validar el JWT (token). Si el token es inválido
     * o no existe, el flujo se detiene aquí y devuelve un 401.
     */
    fastify.register(async (authenticatedApp) => {
        // Aquí se aplicaría: authenticatedApp.addHook('preHandler', fastify.authenticate)

        /**
         * BLOQUE DE VERIFICACIÓN DE PROFESIONAL (RBAC)
         * Dentro de este sub-contexto, solo pueden acceder usuarios con rol 'PROFESSIONAL'.
         * Se utiliza un 'preHandler' adicional que consulta los metadatos del usuario
         * autenticado para verificar sus permisos antes de ejecutar la lógica de negocio.
         */
        authenticatedApp.register(async (professionalApp) => {
            // Aquí se aplicaría: professionalApp.addHook('preHandler', fastify.verifyProfessionalRole)

            professionalApp.register(
                sendToPatient({
                    patientContactRepo,
                    outboxRepo, // Activamos el uso de la tabla Outbox para DigitalOcean
                })
            );

            professionalApp.register(
                sendWeeklyStats({
                    statsRepo,
                    outboxRepo, // Delegamos el envío y generación de imágenes al Worker
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