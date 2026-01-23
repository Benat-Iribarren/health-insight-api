import { FastifyReply, FastifyRequest } from 'fastify';
import { IDENTITY_RESPONSES } from '@src/identity/domain/responses/IdentityResponses';

export const authenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<boolean> => {
    try {
        await request.jwtVerify();
        const decoded = request.user as any;
        request.user = { id: decoded.sub };
        return true;
    } catch {
        const err = IDENTITY_RESPONSES.ERRORS.INVALID_TOKEN;
        reply.status(err.status).send({ message: err.message });
        return false;
    }
};
