import Fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';

import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

import { registerRoutes } from '../endpoints/routes';
import { securityLogger } from './securityLogger';

export function build(): FastifyInstance {
    const isDev = process.env.NODE_ENV === 'development';

    const app = Fastify({
        trustProxy: true,
        logger: {
            transport: isDev ? { target: 'pino-pretty' } : undefined
        }
    });

    // 1. HELMET: Protege cabeceras HTTP (Capa de Infraestructura)
    app.register(helmet, {
        contentSecurityPolicy: false,
    });

    // 2. CORS: Control de acceso por origen (Capa de Red)
    const allowedOrigins = [
        'https://digital-therapy-platform.web.app',
        'https://digital-therapy-platform.firebaseapp.com',
        'http://localhost:4174',
        'http://localhost:4173',
    ];

    app.register(cors, {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (isDev) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            return cb(new Error('Not allowed by CORS'), false);
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', "PATCH"],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
    });

    // 3. RATE LIMIT: Evita abusos y ataques DDoS (Capa de Aplicación)
    app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
            error: 'Demasiadas peticiones. Por favor, inténtelo de nuevo en un minuto.'
        })
    });

    app.register(jwt, {
        secret: process.env.SUPABASE_JWT_SECRET || 'super-secret-key'
    });

    registerSwagger(app);
    registerSwaggerUI(app);

    registerRoutes(app);

    // 4. SECURITY LOGGER: Registro de actividades sospechosas (Capa de Aplicación) He cambiardo de preHandle a onResponse para capturar el identificador de usuario
    app.addHook('onSend', async (request, reply, payload) => {
        securityLogger(app, request, reply).catch(err => app.log.error(err));
        return payload;
    });

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
        console.log(`\tDocumentación: https://health-insight-api.onrender.com/docs\n`);
    } catch (err: any) {
        console.error(' ❌ Error crítico al arrancar:', err);
        fastify.log.error(err);
        process.exit(1);
    }
};
