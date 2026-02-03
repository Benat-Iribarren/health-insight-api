import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyHybridAccess, verifyProfessional, verifyPatient } from '../IdentityMiddlewares';
import { UserRepository } from '../../../domain/interfaces/repositories/UserRepository';

jest.mock('../../http/authenticate', () => ({
    authenticate: jest.fn(),
}));

describe('Unit | IdentityMiddlewares', () => {
    const mockUserRepo = {
        isProfessional: jest.fn(),
        isPatient: jest.fn(),
        getPatientIdByUserId: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    const { authenticate } = require('../../http/authenticate');

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRON_SECRET_KEY = 'test-cron-secret';
    });

    describe('verifyHybridAccess', () => {
        it('sets auth to cron when valid cron secret is provided', async () => {
            const req = { headers: { 'x-health-insight-cron': 'test-cron-secret' }, auth: undefined } as unknown as FastifyRequest;
            const reply = {} as FastifyReply;

            const middleware = verifyHybridAccess(mockUserRepo);
            await middleware(req, reply);

            expect(req.auth).toEqual({ userId: 'cron' });
            expect(mockUserRepo.isProfessional).not.toHaveBeenCalled();
        });

        it('does not set auth when cron secret is invalid', async () => {
            const req = { headers: { 'x-health-insight-cron': 'wrong-secret' }, auth: undefined } as unknown as FastifyRequest;
            const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as FastifyReply;

            authenticate.mockResolvedValue(false);

            const middleware = verifyHybridAccess(mockUserRepo);
            await middleware(req, reply);

            expect(req.auth).toBeUndefined();
        });

        it('returns 403 when user is not professional', async () => {
            const req = { headers: {}, auth: { userId: 'test-user' } } as unknown as FastifyRequest;
            const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as FastifyReply;

            authenticate.mockResolvedValue(true);
            mockUserRepo.isProfessional.mockResolvedValue(false);

            const middleware = verifyHybridAccess(mockUserRepo);
            await middleware(req, reply);

            expect(reply.status).toHaveBeenCalledWith(403);
            expect(reply.send).toHaveBeenCalledWith({
                error: 'Only professionals or system tasks can access this resource'
            });
        });

        it('allows access when user is professional', async () => {
            const req = { headers: {}, auth: { userId: 'test-user' } } as unknown as FastifyRequest;
            const reply = { status: jest.fn(), send: jest.fn() } as unknown as FastifyReply;

            authenticate.mockResolvedValue(true);
            mockUserRepo.isProfessional.mockResolvedValue(true);

            const middleware = verifyHybridAccess(mockUserRepo);
            await middleware(req, reply);

            expect((reply as any).status).not.toHaveBeenCalled();
        });
    });

    describe('verifyProfessional', () => {
        it('returns 403 when user is not professional', async () => {
            const req = { headers: {}, auth: { userId: 'test-user' } } as unknown as FastifyRequest;
            const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as FastifyReply;

            authenticate.mockResolvedValue(true);
            mockUserRepo.isProfessional.mockResolvedValue(false);

            const middleware = verifyProfessional(mockUserRepo);
            await middleware(req, reply);

            expect(reply.status).toHaveBeenCalledWith(403);
            expect(reply.send).toHaveBeenCalledWith({
                error: 'Access restricted to professionals only'
            });
        });

        it('allows access when user is professional', async () => {
            const req = { headers: {}, auth: { userId: 'test-user' } } as unknown as FastifyRequest;
            const reply = { status: jest.fn(), send: jest.fn() } as unknown as FastifyReply;

            authenticate.mockResolvedValue(true);
            mockUserRepo.isProfessional.mockResolvedValue(true);

            const middleware = verifyProfessional(mockUserRepo);
            await middleware(req, reply);

            expect((reply as any).status).not.toHaveBeenCalled();
        });

        it('does not proceed when authentication fails', async () => {
            const req = { headers: {}, auth: undefined } as unknown as FastifyRequest;
            const reply = {} as FastifyReply;

            authenticate.mockResolvedValue(false);

            const middleware = verifyProfessional(mockUserRepo);
            await middleware(req, reply);

            expect(mockUserRepo.isProfessional).not.toHaveBeenCalled();
        });
    });

    describe('verifyPatient', () => {
        it('returns 403 when user is not patient', async () => {
            const req = { headers: {}, auth: { userId: 'test-user' } } as unknown as FastifyRequest;
            const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as FastifyReply;

            authenticate.mockResolvedValue(true);
            mockUserRepo.isPatient.mockResolvedValue(false);

            const middleware = verifyPatient(mockUserRepo);
            await middleware(req, reply);

            expect(reply.status).toHaveBeenCalledWith(403);
            expect(reply.send).toHaveBeenCalledWith({
                error: 'Access restricted to patients only'
            });
        });

        it('sets patientId when user is patient', async () => {
            const req = { headers: {}, auth: { userId: 'test-user' } } as unknown as FastifyRequest;
            const reply = {} as FastifyReply;

            authenticate.mockResolvedValue(true);
            mockUserRepo.isPatient.mockResolvedValue(true);
            mockUserRepo.getPatientIdByUserId.mockResolvedValue(123);

            const middleware = verifyPatient(mockUserRepo);
            await middleware(req, reply);

            expect(req.auth).toEqual({ userId: 'test-user', patientId: 123 });
        });

        it('does not proceed when authentication fails', async () => {
            const req = { headers: {}, auth: undefined } as unknown as FastifyRequest;
            const reply = {} as FastifyReply;

            authenticate.mockResolvedValue(false);

            const middleware = verifyPatient(mockUserRepo);
            await middleware(req, reply);

            expect(mockUserRepo.isPatient).not.toHaveBeenCalled();
        });
    });
});
