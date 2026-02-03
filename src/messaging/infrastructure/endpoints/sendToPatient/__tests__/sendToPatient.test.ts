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

jest.mock('@src/messaging/infrastructure/gmail/GmailApiMailRepository', () => ({
    GmailApiMailRepository: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({ success: true })
    }))
}));

describe('Integration | sendToPatient', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => await app.close());

    it('POST /messaging/send-to-patient/:patientId returns 200 on success', async () => {
        const { patientId } = await initMessagingTestDatabase();

        const res = await app.inject({
            method: 'POST',
            url: `/messaging/send-to-patient/${patientId}`,
            payload: {
                subject: 'Valid Subject',
                body: 'Valid message body content'
            }
        });

        expect(res.statusCode).toBe(200);
        expect(res.json().data.recipientId).toBe(patientId);
    });

    it('returns 400 for invalid patientId format', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient/not-a-number',
            payload: { subject: 'Test', body: 'Test' }
        });

        expect(res.statusCode).toBe(400);
    });

    it('returns 404 if patient does not exist in database', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient/999999',
            payload: { subject: 'Test', body: 'Test' }
        });

        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('Patient not found.');
    });

    it('returns 400 for missing required payload fields', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: `/messaging/send-to-patient/${patientId}`,
            payload: { subject: 'Only Subject' }
        });

        expect(res.statusCode).toBe(400);
    });
});