import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { UserRepository } from '../../domain/interfaces/repositories/UserRepository';
import { authenticate } from '../http/authenticate';

declare module 'fastify' {
    interface FastifyRequest {
        auth?: {
            userId: string;
            patientId?: number;
        };
    }
}

export const verifyHybridAccess = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const cronSecret = request.headers['x-health-insight-cron'];
        const cronSecretHash = process.env.CRON_SECRET_KEY_HASH;

        if (typeof cronSecret === 'string' && cronSecretHash) {
            const isValidCronSecret = await bcrypt.compare(cronSecret, cronSecretHash);

            if (isValidCronSecret) {
                request.auth = { userId: 'cron' };
                return;
            }
        }

        const ok = await authenticate(request, reply);
        if (!ok) return;

        const userId = request.auth?.userId;
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const isProp = await userRepository.isProfessional(userId);
        if (!isProp) {
            return reply.status(403).send({
                error: 'Access restricted to professionals only'
            });
        }
    };
};

export const verifyProfessional = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const ok = await authenticate(request, reply);
        if (!ok) return;

        const userId = request.auth?.userId;
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const isProp = await userRepository.isProfessional(userId);
        if (!isProp) {
            return reply.status(403).send({
                error: 'Access restricted to professionals only'
            });
        }
    };
};

export const verifyPatient = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const ok = await authenticate(request, reply);
        if (!ok) return;

        const userId = request.auth?.userId;
        if (!userId) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const isPatient = await userRepository.isPatient(userId);
        if (!isPatient) {
            return reply.status(403).send({
                error: 'Access restricted to patients only'
            });
        }

        const patientId = await userRepository.getPatientIdByUserId(userId);
        request.auth = { userId, patientId };
    };
};