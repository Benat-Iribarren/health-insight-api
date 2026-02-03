import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';
import { initBiometricsTestDatabase } from '@src/common/infrastructure/database/test-seeds/biometrics.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: jest.fn(() => (_req: any, _res: any, done: any) => done()),
    verifyProfessional: jest.fn(() => (_req: any, _res: any, done: any) => done()),
    verifyPatient: jest.fn(() => (request: any, _reply: any, done: any) => {
        const patientId = request.headers['x-test-patient-id'];
        request.auth = {
            userId: 'test-user-uuid',
            patientId: patientId ? Number(patientId) : undefined
        };
        done();
    }),
}));

describe('Integration | POST /presence/minute', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('returns 200 and creates interval with valid auth', async () => {
        const seed = await initBiometricsTestDatabase();
        const baseTime = new Date();
        baseTime.setUTCSeconds(0, 0);

        const res = await app.inject({
            method: 'POST',
            url: '/presence/minute',
            headers: {
                'x-test-patient-id': String(seed.patientId)
            },
            payload: {
                contextType: 'dashboard',
                minuteTsUtc: baseTime.toISOString(),
                sessionId: null
            }
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body).toHaveProperty('intervalId');
        expect(body).toHaveProperty('action');
    });

    it('returns 401 when auth is missing', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/presence/minute',
            payload: {
                contextType: 'dashboard',
                minuteTsUtc: new Date().toISOString()
            }
        });

        expect(res.statusCode).toBe(401);
    });

    it('returns 400 for invalid timestamp format', async () => {
        const seed = await initBiometricsTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: '/presence/minute',
            headers: {
                'x-test-patient-id': String(seed.patientId)
            },
            payload: {
                contextType: 'dashboard',
                minuteTsUtc: 'invalid-date'
            }
        });

        expect(res.statusCode).toBe(400);
    });
});