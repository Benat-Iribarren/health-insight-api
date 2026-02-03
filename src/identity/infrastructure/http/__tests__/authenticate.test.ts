import { FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../authenticate';

describe('Unit | authenticate', () => {
    let req: FastifyRequest;
    let reply: FastifyReply;

    beforeEach(() => {
        req = {
            jwtVerify: jest.fn(),
            user: undefined,
            auth: undefined,
        } as unknown as FastifyRequest;

        reply = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        } as unknown as FastifyReply;
    });

    it('sets auth when token is valid', async () => {
        (req.jwtVerify as jest.Mock).mockResolvedValue(undefined);
        req.user = { sub: 'user-123' } as any;

        const result = await authenticate(req, reply);

        expect(result).toBe(true);
        expect(req.auth).toEqual({ userId: 'user-123' });
        expect(reply.status).not.toHaveBeenCalled();
    });

    it('returns false and sends 401 when token is invalid', async () => {
        (req.jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        const result = await authenticate(req, reply);

        expect(result).toBe(false);
        expect(req.auth).toBeUndefined();
        expect(reply.status).toHaveBeenCalledWith(401);
        expect(reply.send).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('returns false and sends 401 when token is expired', async () => {
        (req.jwtVerify as jest.Mock).mockRejectedValue(new Error('Token expired'));

        const result = await authenticate(req, reply);

        expect(result).toBe(false);
        expect(reply.status).toHaveBeenCalledWith(401);
    });
});
