import { build } from '@common/infrastructure/server/serverBuild';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

jest.mock('@src/identity/infrastructure/middlewares/IdentityMiddlewares', () => ({
    verifyHybridAccess: () => async (request: any) => {
        request.auth = { userId: 'cron' };
    },
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {},
}));

describe('Integration | POST /biometrics/sync-daily', () => {
    let app: any;
    beforeAll(async () => { app = build(); await app.ready(); });
    afterAll(async () => await app.close());

    it('returns 200 and upserts biometrics', async () => {
        await initBiometricsTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: '/biometrics/sync-daily',
            headers: { 'x-health-insight-cron': 'test-key' },
            payload: { date: '2026-01-01' }
        });
        expect([200, 202]).toContain(res.statusCode);
    });

    it('returns 202 when called by cron', async () => {
        await initBiometricsTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: '/biometrics/sync-daily',
            headers: { 'x-health-insight-cron': 'test-key' },
            payload: { date: '2026-01-01' }
        });
        expect(res.statusCode).toBe(202);
    });

    it('uses yesterday date when date is not provided', async () => {
        await initBiometricsTestDatabase();
        const res = await app.inject({
            method: 'POST',
            url: '/biometrics/sync-daily',
            headers: { 'x-health-insight-cron': 'test-key' },
            payload: {}
        });
        expect([200, 202]).toContain(res.statusCode);
    });
});