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
        sendMail: jest.fn().mockResolvedValue(undefined)
    }))
}));
jest.mock('@src/messaging/application/services/SendToPatientService', () => ({
    SendToPatientService: jest.fn().mockImplementation(() => ({
        execute: jest.fn(async (input: any) => {
            if (typeof input.patientId !== 'number' || input.patientId <= 0 || !input.subject || !input.content) return 'INVALID_INPUT';
            if (input.patientId === 999999) return 'NO_EMAIL';
            return 'SUCCESSFUL';
        }),
    })),
}));

describe('Integration | sendToPatient', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => await app.close());

    it('POST /messaging/send returns 200 on success', async () => {
        const { patientId } = await initMessagingTestDatabase();

        const res = await app.inject({
            method: 'POST',
            url: `/messaging/send`,
            payload: {
                patientId,
                subject: 'Valid Subject',
                content: 'Valid message body content'
            }
        });

        expect(res.statusCode).toBe(200);
        expect(res.json().message).toBe('Sent successfully');
    });

    it('returns 400 for invalid patientId format', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send',
            payload: { patientId: 'not-a-number' as any, subject: 'Test', content: 'Test' }
        });

        expect(res.statusCode).toBe(400);
    });

    it('returns 404 if patient does not exist in database', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send',
            payload: { patientId: 999999, subject: 'Test', content: 'Test' }
        });

        expect(res.statusCode).toBe(404);
        expect(res.json().error).toBe('No email found');
    });

    it('returns 400 for missing required payload fields', async () => {
        const { patientId } = await initMessagingTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: `/messaging/send`,
            payload: { patientId, subject: 'Only Subject' }
        });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 for zero patientId', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send',
            payload: { patientId: 0, subject: 'Test', content: 'Test' }
        });

        expect(res.statusCode).toBe(400);
    });

    it('returns 400 for negative patientId', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/messaging/send',
            payload: { patientId: -1, subject: 'Test', content: 'Test' }
        });

        expect(res.statusCode).toBe(400);
    });
});