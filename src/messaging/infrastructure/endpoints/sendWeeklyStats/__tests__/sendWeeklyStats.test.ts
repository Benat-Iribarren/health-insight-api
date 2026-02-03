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

describe('Integration | sendWeeklyStats', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => await app.close());

    it('POST /messaging/send-weekly-stats returns 202 and starts bulk process', async () => {
        await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(202);
        expect(res.json().message).toContain('processing started');
    });

    it('POST /messaging/send-weekly-stats/:patientId triggers stats for single user', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: `/messaging/send-weekly-stats/${patientId}`,
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(200);
        expect(res.json().data.processedCount).toBe(1);
    });

    it('returns 404 if patientId is provided but no data exists for them', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats/888888',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('No data found to send weekly stats.');
    });

    it('returns 403 if cron secret is invalid', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats',
            headers: { 'x-health-insight-cron': 'wrong-secret' }
        });

        expect(res.statusCode).toBe(403);
    });
});