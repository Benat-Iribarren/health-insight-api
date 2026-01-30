jest.mock('@src/identity/infrastructure/http/verifyUser', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {},
}));

import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

describe('Integration | GET /reports/:patientId/:sessionId?', () => {
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
        await initBiometricsTestDatabase();
    });

    it('returns 400 when patientId is invalid', async () => {
        const res = await app.inject({ method: 'GET', url: '/reports/abc' });
        expect(res.statusCode).toBe(400);
        expect(res.json()).toEqual({ error: 'Invalid input' });
    });

    it('returns 200 with array for patientId', async () => {
        const seed = await initBiometricsTestDatabase();
        const res = await app.inject({ method: 'GET', url: `/reports/${seed.patientDbId}` });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(body[0]).toHaveProperty('session_id');
        expect(body[0]).toHaveProperty('dizziness_percentage');
        expect(body[0]).toHaveProperty('objective_analysis');
    });

    it('returns 200 with object for patientId + sessionId', async () => {
        const seed = await initBiometricsTestDatabase();
        const res = await app.inject({ method: 'GET', url: `/reports/${seed.patientDbId}/${seed.patientSessionCompletedId}` });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body).toHaveProperty('session_id');
        expect(body.session_id).toBe(String(seed.patientSessionCompletedId));
    });
});
