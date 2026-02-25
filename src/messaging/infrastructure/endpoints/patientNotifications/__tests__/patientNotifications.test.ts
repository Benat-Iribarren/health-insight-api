import { FastifyInstance } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyProfessional: jest.fn(() => (req: any, res: any, done: any) => {
        req.auth = { userId: 'pro-user-uuid' };
        done();
    }),
    verifyPatient: jest.fn(() => (req: any, res: any, done: any) => {
        const pId = req.headers['x-test-patient-id'];
        if (!pId || pId === '') {
            res.status(401).send({ error: 'Unauthorized' });
            return;
        }
        req.auth = { userId: 'patient-uuid', patientId: Number(pId) };
        done();
    }),
    verifyHybridAccess: jest.fn(() => (req: any, res: any, done: any) => done())
}));

jest.mock('@src/messaging/infrastructure/database/SupabaseNotificationRepository', () => {
    return {
        SupabaseNotificationRepository: jest.fn().mockImplementation(() => ({
            getPatientNotifications: jest.fn().mockResolvedValue([
                { id: 'notification-id', patient_id: 1, subject: 'S', content: 'C', is_read: false, created_at: new Date().toISOString(), is_deleted: false }
            ]),
            getNotificationDetail: jest.fn().mockImplementation((pId, id) => {
                if (id === '00000000-0000-0000-0000-000000000000') return Promise.resolve(null);
                return Promise.resolve({ id, patient_id: pId, subject: 'S', content: 'C', is_read: false, created_at: new Date().toISOString(), is_deleted: false });
            }),
            markAsRead: jest.fn().mockResolvedValue(undefined),
            deleteNotification: jest.fn().mockResolvedValue(true),
            markNotificationAsDeleted: jest.fn().mockResolvedValue(undefined)
        }))
    };
});

describe('Integration | patientNotifications', () => {
    let app: FastifyInstance;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('PATCH /messaging/notifications/:id marks notification as read', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: `/messaging/notifications/notification-id`,
            headers: { 'x-test-patient-id': '1' }
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
        const res = await app.inject({
            method: 'GET',
            url: '/messaging/notifications',
            headers: { 'x-test-patient-id': '1' }
        });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.json())).toBe(true);
    });

    it('PATCH /messaging/notifications/:id returns 401 if patientId is missing', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: `/messaging/notifications/notification-id`,
            headers: { 'x-test-patient-id': '' }
        });
        expect(res.statusCode).toBe(401);
    });

    it('PATCH /messaging/notifications/:id returns 404 for non-existent notification', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: '/messaging/notifications/00000000-0000-0000-0000-000000000000',
            headers: { 'x-test-patient-id': '1' }
        });
        expect(res.statusCode).toBe(404);
    });

    it('DELETE /messaging/notifications/:id returns 200 on success', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: `/messaging/notifications/notification-id`,
            headers: { 'x-test-patient-id': '1' }
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().message).toContain('deleted');
    });

    it('DELETE /messaging/notifications/:id returns 401 if patientId is missing', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: `/messaging/notifications/notification-id`,
            headers: { 'x-test-patient-id': '' }
        });
        expect(res.statusCode).toBe(401);
    });

    it('DELETE /messaging/notifications/:id returns 404 for non-existent notification', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/messaging/notifications/00000000-0000-0000-0000-000000000000',
            headers: { 'x-test-patient-id': '1' }
        });
        expect(res.statusCode).toBe(404);
    });
});