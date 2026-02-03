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
        if (pId && pId !== '') {
            req.auth = { userId: 'patient-uuid', patientId: Number(pId) };
        } else {
            req.auth = { userId: 'patient-uuid' };
        }
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
        const res = await app.inject({
            method: 'GET',
            url: '/messaging/notifications',
            headers: { 'x-test-patient-id': '' }
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /messaging/notifications returns 200 with notifications list', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'GET',
            url: '/messaging/notifications',
            headers: { 'x-test-patient-id': String(patientId) }
        });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.json())).toBe(true);
    });

    it('POST /messaging/notifications/:id returns 401 if patientId is missing', async () => {
        const { notificationId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: `/messaging/notifications/${notificationId}`,
            headers: { 'x-test-patient-id': '' }
        });
        expect(res.statusCode).toBe(401);
    });

    it('POST /messaging/notifications/:id returns 404 for non-existent notification', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/notifications/00000000-0000-0000-0000-000000000000',
            headers: { 'x-test-patient-id': String(patientId) }
        });
        expect(res.statusCode).toBe(404);
    });

    it('DELETE /messaging/notifications/:id returns 200 on success', async () => {
        const { patientId, notificationId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'DELETE',
            url: `/messaging/notifications/${notificationId}`,
            headers: { 'x-test-patient-id': String(patientId) }
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().message).toContain('deleted');
    });

    it('DELETE /messaging/notifications/:id returns 401 if patientId is missing', async () => {
        const { notificationId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'DELETE',
            url: `/messaging/notifications/${notificationId}`,
            headers: { 'x-test-patient-id': '' }
        });
        expect(res.statusCode).toBe(401);
    });

    it('DELETE /messaging/notifications/:id returns 404 for non-existent notification', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'DELETE',
            url: '/messaging/notifications/00000000-0000-0000-0000-000000000000',
            headers: { 'x-test-patient-id': String(patientId) }
        });
        expect(res.statusCode).toBe(404);
    });
});