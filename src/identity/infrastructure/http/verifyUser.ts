import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRepository } from '../../domain/interfaces/repositories/UserRepository';
import { authenticate } from './authenticate';
import { IDENTITY_RESPONSES } from '@src/identity/domain/responses/IdentityResponses';

declare module 'fastify' {
    interface FastifyRequest {
        auth?: {
            userId: string;
            patientId?: number;
        };
    }
}

const send = (reply: FastifyReply, err: { status: number; message: string }) =>
    reply.status(err.status).send({ error: err.message });

export const verifyHybridAccess = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const cronSecret = request.headers['x-health-insight-cron'];

        if (cronSecret && cronSecret === process.env.CRON_SECRET_KEY) {
            request.auth = { userId: 'cron' };
            return;
        }

        const ok = await authenticate(request, reply);
        if (!ok) return;

        const userId = request.auth?.userId;
        if (!userId) return;

        const isProp = await userRepository.isProfessional(userId);
        if (!isProp) {
            return send(reply, IDENTITY_RESPONSES.ERRORS.FORBIDDEN_HYBRID_ACCESS);
        }
    };
};

export const verifyProfessional = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const ok = await authenticate(request, reply);
        if (!ok) return;

        const userId = request.auth?.userId;
        if (!userId) return;

        const isProp = await userRepository.isProfessional(userId);
        if (!isProp) {
            return send(reply, IDENTITY_RESPONSES.ERRORS.FORBIDDEN_PROFESSIONAL_ONLY);
        }
    };
};

export const verifyPatient = (userRepository: UserRepository) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const ok = await authenticate(request, reply);
        if (!ok) return;

        const userId = request.auth?.userId;
        if (!userId) return;

        const isPatient = await userRepository.isPatient(userId);
        if (!isPatient) {
            return send(reply, IDENTITY_RESPONSES.ERRORS.FORBIDDEN_PATIENT_ONLY);
        }

        const patientId = await userRepository.getPatientIdByUserId(userId);
        request.auth = { userId, patientId };
    };
};