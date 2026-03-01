import { FastifyInstance } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

jest.mock('@src/messaging/infrastructure/images/HtmlImageGenerator', () => ({
    HtmlImageGenerator: jest.fn().mockImplementation(() => ({
        generateWeeklyDashboard: jest.fn().mockResolvedValue(Buffer.from('abc'))
    }))
}));
jest.mock('@src/messaging/infrastructure/gmail/GmailApiMailRepository', () => ({
    GmailApiMailRepository: jest.fn().mockImplementation(() => ({
        sendMail: jest.fn().mockResolvedValue(undefined)
    }))
}));
jest.mock('@src/messaging/application/services/SendWeeklyStatsService', () => ({
    SendWeeklyStatsService: jest.fn().mockImplementation(() => ({
        execute: jest.fn(async () => ({ sent: 2, skippedNoEmail: 0 })),
    })),
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
            url: '/messaging/weekly-stats',
            headers: { 'x-health-insight-cron': 'valid-test-secret' }
        });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual(expect.objectContaining({ sent: expect.any(Number), skippedNoEmail: expect.any(Number) }));
    });
});