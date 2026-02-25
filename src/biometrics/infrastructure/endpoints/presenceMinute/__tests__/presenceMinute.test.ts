import { FastifyInstance } from 'fastify';
import { build } from '@common/infrastructure/server/serverBuild';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: jest.fn(() => (_req: any, _res: any, done: any) => done()),
    verifyProfessional: jest.fn(() => (_req: any, _res: any, done: any) => done()),
    verifyPatient: jest.fn(() => (request: any, reply: any, done: any) => {
        const patientId = request.headers['x-test-patient-id'];
        if (!patientId) {
            reply.status(401).send({ error: 'Unauthorized' });
            return;
        }
        request.auth = {
            userId: 'test-user-uuid',
            patientId: Number(patientId)
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
        baseTime.setUTCMilliseconds(0);

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
        const baseTime = new Date();
        baseTime.setUTCSeconds(0, 0);
        baseTime.setUTCMilliseconds(0);

        const res = await app.inject({
            method: 'POST',
            url: '/presence/minute',
            payload: {
                contextType: 'dashboard',
                minuteTsUtc: baseTime.toISOString()
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