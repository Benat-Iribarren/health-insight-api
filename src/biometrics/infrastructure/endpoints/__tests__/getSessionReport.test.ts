jest.mock('@src/identity/infrastructure/http/verifyUser', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {}
}));

import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

describe('GET /reports/:patientId/:sessionId', () => {
    let app: any;
    let patientId: number;
    let sessionId: number;

    beforeAll(async () => {
        const { build } = require('@common/infrastructure/server/serverBuild');

        app = build();
        await app.ready();

        const seed = await initTestDatabase();
        patientId = seed.patientId;
        sessionId = seed.sessionId;
    });

    afterAll(async () => {
        await app.close();
    });

    it('should return 200 and the unified report when session exists', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/reports/${patientId}/${sessionId}`
        });

        expect(response.statusCode).toBe(200);

        const data = response.json();
        const report = Array.isArray(data) ? data[0] : data;
        expect(report).toHaveProperty('session_id', sessionId.toString());
    });

    it('should return 404 when the session does not exist', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/reports/${patientId}/999999`
        });

        expect(response.statusCode).toBe(404);
    });
});
