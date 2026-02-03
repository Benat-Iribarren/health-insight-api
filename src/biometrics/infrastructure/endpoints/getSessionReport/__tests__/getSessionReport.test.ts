import { build } from '@common/infrastructure/server/serverBuild';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async (request: any) => {
        request.auth = { userId: 'pro-user' };
    },
    verifyPatient: () => async () => {},
}));

describe('Integration | GET /reports/:patientId/:sessionId?', () => {
    let app: any;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('returns 200 with array for patientId', async () => {
        const seed = await initBiometricsTestDatabase();
        const res = await app.inject({ method: 'GET', url: `/reports/${seed.patientId}` });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.json())).toBe(true);
    });

    it('returns 200 with object for patientId + sessionId', async () => {
        const seed = await initBiometricsTestDatabase();
        const res = await app.inject({ method: 'GET', url: `/reports/${seed.patientId}/${seed.patientSessionId}` });
        expect(res.statusCode).toBe(200);
        expect(res.json().session_id).toBe(String(seed.patientSessionId));
    });
});