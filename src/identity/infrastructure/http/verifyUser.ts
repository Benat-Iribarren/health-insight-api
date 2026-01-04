import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRepository } from '../../domain/interfaces/repositories/UserRepository';

export const verifyProfessional = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        const isProp = await userRepository.isProfessional(userId);
        if (!isProp) {
            return reply.status(403).send({
                error: 'Only professionals can access this resource'
            });
        }
    };
};

export const verifyPatient = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request.user as { id?: string } | undefined)?.id;
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        const isPatient = await userRepository.isPatient(userId);
        if (!isPatient) {
            return reply.status(403).send({
                error: 'Only patients can access this resource'
            });
        }
    };
};

export const verifyProfessionalOrCron = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const cronKey = request.headers['x-cron-key'];
        const masterKey = process.env.CRON_SECRET_KEY;

        if (cronKey && cronKey === masterKey) {
            return;
        }

        try {
            await request.jwtVerify();
            const userId = (request.user as { id?: string })?.id;
            if (userId) {
                const isPro = await userRepository.isProfessional(userId);
                if (isPro) return;
            }
        } catch (err) {}

        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Se requiere API Key de Cron o sesión de Profesional'
        });
    };
};