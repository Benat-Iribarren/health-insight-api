import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyProfessional: jest.fn(() => (req: any, res: any, done: any) => {
        req.auth = { userId: 'pro-user-uuid' };
        done();
    }),
    verifyPatient: jest.fn(() => (req: any, res: any, done: any) => {
        const pId = req.headers['x-test-patient-id'];
        req.auth = { userId: 'patient-uuid', patientId: pId ? Number(pId) : 1 };
        done();
    }),
    verifyHybridAccess: jest.fn(() => (req: any, res: any, done: any) => {
        const cron = req.headers['x-health-insight-cron'];
        if (cron === 'valid-test-secret') req.auth = { userId: 'cron' };
        done();
    })
}));

describe('Integration | patientNotifications', () => {
    let app: FastifyInstance;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('POST /messaging/notifications/:id marks notification as read', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: `/messaging/notifications/${notificationId}`,
            headers: { 'x-test-patient-id': String(patientId) }
        });
        expect(res.statusCode).toBe(200);
    });

    it('GET /messaging/notifications returns 401 if patientId is missing', async () => {
        const Mids = require('@src/identity/infrastructure/middlewares/IdentityMiddlewares');
        const originalVerify = Mids.verifyPatient;
        Mids.verifyPatient.mockImplementation(() => (req: FastifyRequest, _res: FastifyReply, done: (err?: Error) => void) => {
            (req as any).auth = undefined;
            done();
        });
        const res = await app.inject({
            method: 'GET',
            url: '/messaging/notifications',
            headers: { 'x-test-patient-id': '' }
        });
        expect(res.statusCode).toBe(401);
        Mids.verifyPatient.mockImplementation(originalVerify);
    });
});