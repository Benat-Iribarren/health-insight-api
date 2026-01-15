import { build } from '@common/infrastructure/server/serverBuild';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

jest.mock('@src/messaging/infrastructure/gmail/GmailApiMailRepository', () => ({
    GmailApiMailRepository: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({ success: true })
    }))
}));

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
        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient',
            payload: {
                patientId,
                subject: 'Recordatorio de Salud',
                body: 'Este es un mensaje de prueba para el test de integración.'
            }
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            status: 'success',
            message: 'Mensaje guardado y notificación enviada correctamente'
        });
    });

    it('should return 404 when the patient does not exist in the database', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/messaging/send-to-patient',
            payload: {
                patientId: 999999,
                subject: 'Inexistente',
                body: 'No debería enviarse'
            }
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual({
            status: 'error',
            message: 'No se encontró contacto'
        });
    });
});
