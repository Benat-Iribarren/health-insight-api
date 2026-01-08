import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { MESSAGING_RESPONSES } from '../../../domain/MessagingError';

describe('POST /messaging/send-to-patient', () => {
    let app: any;
    let patientId: number;

    beforeAll(async () => {
        app = build();
        await app.ready();
        const seed = await initTestDatabase();
        patientId = seed.patientId;
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 and success message when sending to a valid patient', async () => {
        const successConfig = MESSAGING_RESPONSES.SUCCESS.SEND_TO_PATIENT;

        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient',
            payload: {
                patientId: patientId,
                subject: 'Recordatorio de Salud',
                body: 'Este es un mensaje de prueba para el test de integración.'
            }
        });

        expect(response.statusCode).toBe(successConfig.code);
        expect(response.json()).toEqual({
            status: successConfig.status,
            message: successConfig.message
        });
    });

    it('should return 404 when the patient does not exist in the database', async () => {
        const errorConfig = MESSAGING_RESPONSES.ERRORS.PATIENT_EMAIL_NOT_FOUND;

        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient',
            payload: {
                patientId: 999999,
                subject: 'Inexistente',
                body: 'No debería enviarse'
            }
        });

        expect(response.statusCode).toBe(errorConfig.status);
        expect(response.json()).toEqual({
            status: 'error',
            error: {
                code: errorConfig.code,
                message: errorConfig.message
            }
        });
    });
});