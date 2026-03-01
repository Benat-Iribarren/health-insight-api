import { FastifyInstance } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyProfessional: jest.fn(() => (req: any, _res: any, done: any) => {
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
    verifyHybridAccess: jest.fn(() => (req: any, _res: any, done: any) => done()),
}));

jest.mock('@src/messaging/infrastructure/database/repositories/SupabaseNotificationRepository', () => {
    return {
        SupabaseNotificationRepository: jest.fn().mockImplementation(() => ({
            listByPatient: jest.fn().mockResolvedValue([
                {
                    id: 'notification-id',
                    patientId: 1,
                    subject: 'S',
                    content: 'C',
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    isDeleted: false,
                },
            ]),
            findByPatient: jest.fn().mockResolvedValue({
                id: 'notification-id',
                patientId: 1,
                subject: 'S',
                content: 'C',
                isRead: false,
                createdAt: new Date().toISOString(),
                isDeleted: false,
            }),
            markRead: jest.fn().mockResolvedValue(true),
            softDelete: jest.fn().mockResolvedValue(true),
        })),
    };
});

describe('messaging patientNotifications endpoint', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await build();
    });

    afterAll(async () => {
        await app.close();
    });

    test('GET /messaging/notifications returns notifications', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/messaging/notifications',
            headers: { 'x-test-patient-id': '1' },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body[0]).toMatchObject({ id: 'notification-id', patientId: 1 });
    });

    test('PATCH /messaging/notifications/:id marks read', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: '/messaging/notifications/notification-id',
            headers: { 'x-test-patient-id': '1' },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body).toMatchObject({ id: 'notification-id', patientId: 1, isRead: true });
    });

    test('DELETE /messaging/notifications/:id deletes notification', async () => {
        const res = await app.inject({
            method: 'DELETE',
            url: '/messaging/notifications/notification-id',
            headers: { 'x-test-patient-id': '1' },
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body).toMatchObject({ id: 'notification-id' });
    });
});
