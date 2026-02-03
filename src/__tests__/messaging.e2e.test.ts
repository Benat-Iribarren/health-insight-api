import { FastifyInstance } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

jest.mock('@src/messaging/infrastructure/images/HtmlImageGenerator', () => ({
    HtmlImageGenerator: jest.fn().mockImplementation(() => ({
        generateWeeklyDashboard: jest.fn().mockResolvedValue(Buffer.from('abc'))
    }))
}));

describe('Messaging E2E', () => {
    let app: FastifyInstance;
    beforeAll(async () => {
        process.env.CRON_SECRET_KEY = 'valid-test-secret';
        app = build();
        await app.ready();
    });
    afterAll(async () => await app.close());

    it('should trigger weekly stats automation', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });
        expect([200, 202]).toContain(res.statusCode);
    });
});