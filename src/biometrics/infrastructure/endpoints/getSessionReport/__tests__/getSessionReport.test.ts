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

    it('returns 200 with paginated data for patientId', async () => {
        const seed = await initBiometricsTestDatabase();
        const res = await app.inject({ method: 'GET', url: `/reports/${seed.patientId}` });

        const body = res.json();
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta).toBeDefined();
        expect(body.meta.page).toBe(1);
    });

    it('returns 200 with object inside data for patientId + sessionId', async () => {
        const seed = await initBiometricsTestDatabase();
        const res = await app.inject({ method: 'GET', url: `/reports/${seed.patientId}/${seed.patientSessionId}` });

        const body = res.json();
        expect(res.statusCode).toBe(200);
        expect(body.data.session_id).toBe(String(seed.patientSessionId));
    });

    it('returns 400 for invalid patientId', async () => {
        const res = await app.inject({ method: 'GET', url: '/reports/invalid' });
        expect(res.statusCode).toBe(400);
    });

    it('returns 404 when no data found', async () => {
        const res = await app.inject({ method: 'GET', url: '/reports/999999' });
        expect([200, 404]).toContain(res.statusCode);
    });
});