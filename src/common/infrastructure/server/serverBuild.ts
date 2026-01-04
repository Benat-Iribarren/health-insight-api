import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import { registerRoutes } from '../endpoints/routes';

export function build(): FastifyInstance {
    const app = Fastify({
        logger: {
            transport: process.env.NODE_ENV === 'development'
                ? { target: 'pino-pretty' }
                : undefined
        }
    });

    app.register(jwt, {
        secret: process.env.SUPABASE_JWT_SECRET || 'super-secret-key'
    });

    registerSwagger(app);
    registerSwaggerUI(app);
    registerRoutes(app);

    return app;
}

function registerSwagger(app: FastifyInstance) {
    app.register(swagger, {
        openapi: {
            info: {
                title: 'HealthInsight API',
                description: 'API de Telerehabilitación con análisis de mareo',
                version: '1.0.0',
            },
        },
    });
}

function registerSwaggerUI(app: FastifyInstance) {
    app.register(swaggerUI, {
        routePrefix: '/docs',
    });
}

export const start = async (fastify: FastifyInstance, PORT: number): Promise<void> => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`\n SERVIDOR ACTIVO`);
        console.log(`\tPuerto: ${PORT}`);
        console.log(`\tEntorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`\tDocumentación: http://0.0.0.0:${PORT}/docs\n`);
    } catch (err: any) {
        console.error(' ❌ Error crítico al arrancar:', err);
        fastify.log.error(err);
        process.exit(1);
    }
};