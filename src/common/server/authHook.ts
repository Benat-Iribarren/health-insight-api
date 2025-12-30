import { FastifyReply, FastifyRequest } from 'fastify';
import { supabaseClient } from '../storage/infrastructure/supabaseClient';
import { SupabaseUserRepository } from '../storage/infrastructure/SupabaseUserRepository';

const userRepo = new SupabaseUserRepository(supabaseClient);

export const verifyProfessional = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.status(401).send({ error: 'MISSING_TOKEN' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) return reply.status(401).send({ error: 'INVALID_TOKEN' });

    const isPatient = await userRepo.isPatient(user.id);

    if (isPatient) {
        return reply.status(403).send({ error: 'FORBIDDEN', message: 'User is a patient' });
    }

    (request as any).userId = user.id;
};