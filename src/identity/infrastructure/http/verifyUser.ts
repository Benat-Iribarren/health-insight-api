import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRepository } from '../../domain/interfaces/repositories/UserRepository';
import { authenticate } from './authenticate';

export const verifyHybridAccess = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const cronSecret = request.headers['x-health-insight-cron'];

        if (cronSecret && cronSecret === process.env.CRON_SECRET_KEY) {
            (request as any).isCron = true;
            return;
        }

        await authenticate(request, reply);

        const userId = (request.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return reply.status(401).send({ error: 'No autorizado' });
        }

        const isProp = await userRepository.isProfessional(userId);
        if (!isProp) {
            return reply.status(403).send({
                error: 'Solo el personal profesional o tareas del sistema pueden acceder a este recurso'
            });
        }
    };
};

export const verifyProfessional = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        await authenticate(request, reply);

        const userId = (request.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return reply.status(401).send({ error: 'No autorizado' });
        }
        const isProp = await userRepository.isProfessional(userId);
        if (!isProp) {
            return reply.status(403).send({
                error: 'Solo los profesionales pueden acceder a este recurso'
            });
        }
    };
};

export const verifyPatient = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        await authenticate(request, reply);

        const userId = (request.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return reply.status(401).send({ error: 'No autorizado' });
        }
        const isPatient = await userRepository.isPatient(userId);
        if (!isPatient) {
            return reply.status(403).send({
                error: 'Solo los pacientes pueden acceder a este recurso'
            });
        }
    };
};