import { FastifyReply, FastifyRequest } from 'fastify';

export const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<boolean> => {
    try {
        await request.jwtVerify();
        const decoded = request.user as { sub: string };
        request.auth = { userId: decoded.sub };
        return true;
    } catch {
        reply.status(401).send({ error: 'Invalid or expired token' });
        return false;
    }
};