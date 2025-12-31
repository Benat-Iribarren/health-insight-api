import { FastifyInstance } from 'fastify';

export function registerRoutes(fastify: FastifyInstance) { fastify.get('/health', async () => { return { status: 'ok', service: 'HealthInsight API' }; }); }