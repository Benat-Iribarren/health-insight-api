import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export const buildServer = async () => {
    const server = fastify({
        logger: {
            transport: {
                target: 'pino-pretty',
            },
        },
    });

    // Configuración de Swagger para la documentación
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

    // Aquí registraremos los módulos más adelante (auth, therapy, etc.)
    // server.register(therapyRoutes);

    return server;
};