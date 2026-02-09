import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRepository } from '../../domain/interfaces/repositories/UserRepository';
import { authenticate } from '../http/authenticate';

// TODO: DIFERENCIA MIDDLEWARE vs CONTROLADOR
// Middleware (preHandler): Es el guardián. Valida identidad/roles y bloquea el acceso si no hay permiso.
// Evita que la lógica de negocio se ejecute innecesariamente, centralizando la seguridad.

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


        if (cronSecret && cronSecret === process.env.CRON_SECRET_KEY) {
            request.auth = { userId: 'cron' };
            return;
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
                error: 'Only professionals or system tasks can access this resource'
            });
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
        if (!userId) return;

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