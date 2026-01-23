import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

jest.mock('@src/messaging/infrastructure/gmail/GmailApiMailRepository', () => ({
    GmailApiMailRepository: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({ success: true })
    }))
}));

jest.mock('@src/messaging/infrastructure/images/HtmlImageGenerator', () => ({
    HtmlImageGenerator: jest.fn().mockImplementation(() => ({
        generateWeeklyDashboard: jest.fn().mockResolvedValue(Buffer.from('mock-image'))
    }))
}));

describe('POST /messaging/send-weekly', () => {
    let app: any;
    const CRON_KEY = 'test-cron-secret';

    beforeAll(async () => {
        process.env.CRON_SECRET_KEY = CRON_KEY;
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 and process patients if database is seeded', async () => {
        await initTestDatabase();

        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly',
            headers: { 'x-health-insight-cron': CRON_KEY },
            payload: {}
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toHaveProperty('processed');
    });

    it('should return 401 if cron secret is missing or invalid', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly',
            headers: { 'x-health-insight-cron': 'wrong-secret' },
            payload: {}
        });

        expect(response.statusCode).toBe(401);
    });
});