jest.mock('@src/identity/infrastructure/http/verifyUser', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {}
}));

jest.mock('@src/messaging/infrastructure/gmail/GmailApiMailRepository', () => ({
    GmailApiMailRepository: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({ success: true })
    }))
}));

import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

describe('POST /messaging/send-to-patient', () => {
    let app: any;
    let patientId: number;

    beforeAll(async () => {
        const { build } = require('@common/infrastructure/server/serverBuild');

        app = build();
        await app.ready();

        const seed = await initTestDatabase();
        patientId = seed.patientId;
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 with valid credentials', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient',
            payload: {
                patientId,
                subject: 'Test',
                body: 'Body'
            }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ status: 'ok' });
    });
});
