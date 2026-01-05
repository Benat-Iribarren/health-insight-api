import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { MESSAGING_RESPONSES } from '../../../domain/MessagingError';

describe('Messaging System E2E Flow', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
        await initTestDatabase();
    });

    afterAll(async () => {
        await app.close();
    });

    test('should complete the weekly reporting cycle for all active patients', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-weekly-stats'
        });

        const successConfig = MESSAGING_RESPONSES.SUCCESS.SEND_WEEKLY_STATS;

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            status: 'success',
            message: successConfig.getMessage(1)
        });
    });

    test('should complete a manual message send flow to a specific patient', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient',
            payload: {
                patientId: 1,
                subject: 'Mensaje E2E',
                body: 'Validando el flujo completo de mensajería.'
            }
        });

        const successConfig = MESSAGING_RESPONSES.SUCCESS.SEND_TO_PATIENT;

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            status: 'success',
            message: successConfig.message
        });
    });

    test('should return 404 when sending to a non-existent patient', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient',
            payload: {
                patientId: 9999,
                subject: 'Error Test',
                body: 'Fail'
            }
        });

        const errorConfig = MESSAGING_RESPONSES.ERRORS.PATIENT_EMAIL_NOT_FOUND;

        expect(response.statusCode).toBe(404);
        expect(response.json().error.code).toBe(errorConfig.code);
    });
});