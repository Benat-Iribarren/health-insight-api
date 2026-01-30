import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';

jest.mock('@src/identity/infrastructure/http/verifyUser', () => ({
    verifyHybridAccess: () => async () => {},
    verifyProfessional: () => async () => {},
    verifyPatient: () => async () => {},
}));

describe('Integration | POST /biometrics/sync-daily', () => {
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

    it('returns 200 and upserts biometrics', async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/biometrics/sync-daily',
            payload: { date: '2026-01-01' },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.status).toBe('success');

        const { data } = await supabaseClient
            .from('BiometricMinutes')
            .select('*')
            .eq('timestamp_iso', '2026-01-01T12:00:00.000Z')
            .single();

        expect(data).toBeTruthy();
        expect(data!.pulse_rate_bpm).toBe(80);
    });
});