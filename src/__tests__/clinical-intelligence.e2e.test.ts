import { build } from '@common/infrastructure/server/serverBuild';
import { initClinicalIntelligenceTestDatabase } from '@common/infrastructure/database/test-seeds/clinicalIntelligence.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async (request: any) => {
        request.auth = { userId: 'pro-user' };
    },
    verifyPatient: () => async () => {},
}));

describe('E2E | Clinical Intelligence', () => {
    let app: any;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('predict dropout flow', async () => {
        await initClinicalIntelligenceTestDatabase();
        const all = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout'
        });
        expect(all.statusCode).toBe(200);
        expect(Array.isArray(all.json())).toBe(true);
    });
});