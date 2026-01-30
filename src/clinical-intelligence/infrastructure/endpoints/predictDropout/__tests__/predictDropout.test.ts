jest.mock('@src/identity/infrastructure/http/verifyUser', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {},
}));

import { initClinicalIntelligenceTestDatabase } from '@common/infrastructure/database/test-seeds/clinicalIntelligence.seed';

describe('Integration | GET /clinical-intelligence/predict-dropout', () => {
    let app: any;

    beforeAll(async () => {
        const { build } = require('@common/infrastructure/server/serverBuild');
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        await initClinicalIntelligenceTestDatabase();
    });

    it('returns 200 and an array when no patientId is provided', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout',
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    it('returns 200 and an array when a valid patientId is provided', async () => {
        const seed = await initClinicalIntelligenceTestDatabase();

        const response = await app.inject({
            method: 'GET',
            url: `/clinical-intelligence/predict-dropout/${seed.patientIdOverdue}`,
        });

        expect(response.statusCode).toBe(200);

        const body = response.json();
        expect(Array.isArray(body)).toBe(true);
        if (body.length > 0) {
            expect(body[0]).toHaveProperty('patientId');
            expect(body[0]).toHaveProperty('riskScore');
            expect(body[0]).toHaveProperty('status');
        }
    });

    it('returns 404 when patientId does not exist', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/999999',
        });

        expect(response.statusCode).toBe(404);

        const body = response.json();
        expect(body).toEqual({ error: 'No clinical data found for analysis.' });
    });

    it('returns 400 when patientId is invalid', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/abc',
        });

        expect(response.statusCode).toBe(400);

        const body = response.json();
        expect(body).toEqual({ error: 'The provided patient ID is invalid.' });
    });
});
