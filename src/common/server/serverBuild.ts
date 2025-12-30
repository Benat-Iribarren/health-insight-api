import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { supabaseClient } from '../storage/infrastructure/supabaseClient';
import { NodemailerEmailRepository } from '@src/messaging/infrastructure/NodemailerEmailRepository';
import { SendPatientEmailUseCase, SendEmailCommand } from '@src/messaging/application/SendPatientEmailUseCase';
import {verifyProfessional} from "@common/server/authHook";

export const buildServer = async () => {
    const server = fastify({
        logger: {
            transport: {
                target: 'pino-pretty',
                options: { colorize: true }
            },
        },
    });

    await server.register(swagger, {
        openapi: {
            info: {
                title: 'HealthInsightAPI',
                description: 'API de Telerehabilitación con análisis de mareo',
                version: '1.0.0',
            },
        },
    });

    await server.register(swaggerUi, {
        routePrefix: '/docs',
    });

    const emailRepo = new NodemailerEmailRepository();
    const sendEmailUseCase = new SendPatientEmailUseCase(emailRepo, supabaseClient);

    server.post<{ Body: SendEmailCommand }>(
        '/messaging/send-to-patient',
        { preHandler: [verifyProfessional] },
        async (request, reply) => {
            try {
                await sendEmailUseCase.execute(request.body);
                return reply.status(200).send({
                    success: true,
                    message: 'Message delivered to patient'
                });
            } catch (error: any) {
                server.log.error(error);
                const status = error.message === 'PATIENT_NOT_FOUND' ? 404 : 500;
                return reply.status(status).send({
                    success: false,
                    error: error.message || 'INTERNAL_MESSAGING_ERROR'
                });
            }
        }
    );

    return server;
};