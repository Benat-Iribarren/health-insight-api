import { build } from '@common/infrastructure/server/serverBuild';
import { initClinicalIntelligenceTestDatabase } from '@common/infrastructure/database/test-seeds/clinicalIntelligence.seed';

describe('E2E | Clinical Intelligence', () => {
    let app: any;

    beforeAll(async () => {
        app = build();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('predict dropout flow', async () => {
        const seed = await initClinicalIntelligenceTestDatabase();

        const all = await app.inject({
            method: 'GET',
            url: '/clinical-intelligence/predict-dropout',
        });

        expect(all.statusCode).toBe(200);

        const one = await app.inject({
            method: 'GET',
            url: `/clinical-intelligence/predict-dropout/${seed.patientIdOverdue}`,
        });

        expect(one.statusCode).toBe(200);
        const body = one.json();
        const data = Array.isArray(body) ? body.find((p: any) => String(p.patientId) === String(seed.patientIdOverdue)) : body;
        expect(data).toBeDefined();
        expect(data.status).toBe('CRITICAL');
    });
});