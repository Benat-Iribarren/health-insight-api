import { build } from '@common/infrastructure/server/serverBuild';
import { initClinicalIntelligenceTestDatabase } from '@common/infrastructure/database/test-seeds/clinicalIntelligence.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async (request: any) => {
        request.auth = { userId: 'pro-user' };
    },
    verifyPatient: () => async () => {},
}));

describe('Integration | GET /clinical-intelligence/predict-dropout', () => {
    let app: any;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('returns 200 and an array when no patientId is provided', async () => {
        await initClinicalIntelligenceTestDatabase();
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout'
        });
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.json())).toBe(true);
    });

    it('returns 400 for invalid patientId', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/invalid'
        });
        expect(response.statusCode).toBe(400);
    });

    it('returns 400 for negative patientId', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/-1'
        });
        expect(response.statusCode).toBe(400);
    });

    it('returns 404 when no data found for patientId', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout/999999'
        });
        expect(response.statusCode).toBe(404);
    });
});