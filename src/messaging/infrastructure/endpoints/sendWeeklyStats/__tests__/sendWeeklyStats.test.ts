import { build } from '@src/common/infrastructure/server/serverBuild';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

jest.mock('@src/messaging/infrastructure/gmail/GmailApiMailRepository', () => ({
    GmailApiMailRepository: jest.fn().mockImplementation(() => ({
        sendMail: jest.fn().mockResolvedValue(undefined)
    }))
}));

jest.mock('@src/messaging/infrastructure/images/HtmlImageGenerator', () => ({
    HtmlImageGenerator: jest.fn().mockImplementation(() => ({
        generateWeeklyDashboard: jest.fn().mockResolvedValue(Buffer.from('abc'))
    }))
}));

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
        if (cron === 'valid-test-secret') {
            req.auth = { userId: 'cron' };
            done();
        } else {
            res.status(403).send({ error: 'Forbidden' });
        }
    })
}));

jest.mock('@src/messaging/application/services/SendWeeklyStatsService', () => ({
    SendWeeklyStatsService: jest.fn().mockImplementation(() => ({
        execute: jest.fn(async (input: any) => {
            if (input.patientId === undefined) return { sent: 2, skippedNoEmail: 0 };
            if (!Number.isFinite(input.patientId) || input.patientId <= 0) return 'INVALID_INPUT';
            if (input.patientId === 888888) return 'NO_EMAIL';
            return { sent: 1, skippedNoEmail: 0 };
        }),
    })),
}));

describe('Integration | sendWeeklyStats', () => {
    let app: any;

    beforeAll(async () => {
        process.env.CRON_SECRET_KEY = 'valid-test-secret';
        app = build();
        await app.ready();
    });

    afterAll(async () => await app.close());

    it('POST /messaging/weekly-stats returns 200 and starts bulk process', async () => {
        await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/weekly-stats',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual(expect.objectContaining({ sent: expect.any(Number), skippedNoEmail: expect.any(Number) }));
    });

    it('POST /messaging/weekly-stats/:patientId triggers stats for single user', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: `/messaging/weekly-stats/${patientId}`,
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ sent: 1, skippedNoEmail: 0 });
    });

    it('returns 404 if patientId is provided but no data exists for them', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/weekly-stats/888888',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('No email found');
    });

    it('returns 403 if cron secret is invalid', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/weekly-stats',
            headers: { 'x-health-insight-cron': 'wrong-secret' }
        });

        expect(res.statusCode).toBe(403);
    });

    it('returns 400 for invalid patientId format', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/weekly-stats/invalid',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 for zero patientId', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/weekly-stats/0',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 for negative patientId', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/weekly-stats/-1',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });

        expect(res.statusCode).toBe(400);
    });
});