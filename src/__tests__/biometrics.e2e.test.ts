import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyPatient: jest.fn(() => (req: FastifyRequest, _res: FastifyReply, done: (err?: Error) => void) => {
        const pId = req.headers['x-test-patient-id'];
        (req as any).auth = { userId: 'patient-test', patientId: pId ? Number(pId) : 1 };
        done();
    }),
    verifyProfessional: jest.fn(() => (_req: any, _res: any, done: any) => done()),
    verifyHybridAccess: jest.fn(() => (_req: any, _res: any, done: any) => done())
}));

describe('Biometrics E2E', () => {
    let app: FastifyInstance;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('should register presence successfully', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const baseTime = new Date();
        baseTime.setUTCSeconds(0, 0);
        baseTime.setUTCMilliseconds(0);
        
        const res = await app.inject({
            method: 'POST',
            url: '/presence/minute',
            headers: { 'x-test-patient-id': String(patientId) },
            payload: {
                minuteTsUtc: baseTime.toISOString(),
                contextType: 'dashboard'
            }
        });
        expect(res.statusCode).toBe(200);
    });
});