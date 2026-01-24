jest.mock('@src/identity/infrastructure/http/verifyUser', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {}
}));

import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { CLINICAL_RESPONSES } from '../../../domain/ClinicalError';

describe('Endpoint: GET /clinical-intelligence/predict-dropout', () => {
    let app: any;

    beforeAll(async () => {
        const { build } = require('@common/infrastructure/server/serverBuild');
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 when no ID is provided', async () => {
        await initTestDatabase();

        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout'
        });

        expect(response.statusCode).toBe(200);
    });

    it('should return 200 when a valid patientId is provided', async () => {
        const seed = await initTestDatabase();

        const response = await app.inject({
            method: 'GET',
            url: `/clinical-intelligence/predict-dropout/${seed.patientId}`
        });

        expect(response.statusCode).toBe(200);
    });

    it('should return 404 when the patientId does not exist', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/999999'
        });

        // según la implementación real del endpoint
        expect(response.statusCode).toBe(CLINICAL_RESPONSES.ERRORS.NO_DATA.status);
    });
});
