import { FastifyInstance } from 'fastify';
import { build } from '@src/common/infrastructure/server/serverBuild';
import { initClinicalIntelligenceTestDatabase } from '@src/common/infrastructure/database/test-seeds/clinicalIntelligence.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async (request: any) => {
        request.auth = { userId: 'pro-user' };
    },
    verifyPatient: () => async () => {},
}));

describe('Clinical Intelligence E2E', () => {
    let app: FastifyInstance;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('should return dropout predictions', async () => {
        await initClinicalIntelligenceTestDatabase();
        const res = await app.inject({ method: 'GET', url: '/clinical-intelligence/predict-dropout' });
        
        expect(res.statusCode).toBe(200);
        const data = res.json();

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        
        const first = data[0];
        expect(first).toHaveProperty('patientId');
        expect(first).toHaveProperty('riskScore');
    });
});