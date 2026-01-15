import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

jest.mock('@src/messaging/infrastructure/gmail/GmailApiMailRepository', () => ({
    GmailApiMailRepository: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({ success: true })
    }))
}));

describe('POST /messaging/send-weekly-stats', () => {
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

    it('should return 200 and process 0 patients if database is empty', async () => {
        const { supabaseClient } = require('@common/infrastructure/database/supabaseClient');
        await supabaseClient.from('PatientSession').delete().neq('id', 0);
        await supabaseClient.from('Patient').delete().neq('id', 0);

        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats',
            headers: { 'x-health-insight-cron': CRON_KEY }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().processed).toBe(0);
    });
});