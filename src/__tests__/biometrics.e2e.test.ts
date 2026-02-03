import { build } from '@common/infrastructure/server/serverBuild';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async (request: any) => {
        request.auth = { userId: 'test-user', patientId: Number(request.params.patientId) };
    },
}));

describe('Biometrics E2E', () => {
    let app: any;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('should return session reports via HTTP', async () => {
        const seed = await initBiometricsTestDatabase();
        const response = await app.inject({
            method: 'GET',
            url: `/reports/${seed.patientId}`
        });

        expect(response.statusCode).toBe(200);
        const payload = response.json();
        expect(Array.isArray(payload)).toBe(true);
    });
});