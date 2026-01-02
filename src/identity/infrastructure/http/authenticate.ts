import { FastifyReply, FastifyRequest } from 'fastify';

export const authenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        await request.jwtVerify();
        const decoded = request.user as any;
        request.user = {
            id: decoded.sub
        };
    } catch (err) {
        reply.status(401).send({
            error: 'Invalid or expired token'
        });
    }
};