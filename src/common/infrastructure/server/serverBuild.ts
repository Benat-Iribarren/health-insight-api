import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { registerRoutes } from '../endpoints/routes';

export function build(): FastifyInstance {
    const app = Fastify({
        logger: {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        },
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
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
        staticCSP: true,
        transformSpecification: (swaggerObject: any) => swaggerObject,
        transformSpecificationClone: true,
    });
}

export const start = async (fastify: FastifyInstance, PORT: number): Promise<void> => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
    } catch (err: any) {
        console.error('Error starting server:', err);
        fastify.log.error(err);
        process.exit(1);
    }
};
