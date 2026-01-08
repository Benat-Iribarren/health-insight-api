import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { MESSAGING_RESPONSES } from '../../../domain/MessagingError';
jest.mock('../../smtp/SmtpMailRepository', () => ({
    SmtpMailRepository: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({ success: true })
    }))
}));

jest.mock('../../images/HtmlImageGenerator', () => ({
    HtmlImageGenerator: jest.fn().mockImplementation(() => ({
        generateWeeklyDashboard: jest.fn().mockResolvedValue(Buffer.from('fake-image-buffer'))
    }))
}));
describe('POST /messaging/send-weekly-stats', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
        await initTestDatabase();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should process weekly stats and return success with the number of patients processed', async () => {
        const successConfig = MESSAGING_RESPONSES.SUCCESS.SEND_WEEKLY_STATS;

        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats'
        });

        expect(response.statusCode).toBe(successConfig.code);
        expect(response.json()).toEqual({
            status: successConfig.status,
            message: successConfig.getMessage(1)
        });
    });

    it('should return 404 if no sessions are found for the statistics period', async () => {
        const { supabaseClient } = require('@common/infrastructure/database/supabaseClient');
        await supabaseClient.from('PatientSession').delete().neq('id', 0);

        const errorConfig = MESSAGING_RESPONSES.ERRORS.NO_STATS_DATA;

        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats'
        });

        expect(response.statusCode).toBe(errorConfig.status);
        expect(response.json().error.code).toBe(errorConfig.code);

        await initTestDatabase();
    });
});