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
