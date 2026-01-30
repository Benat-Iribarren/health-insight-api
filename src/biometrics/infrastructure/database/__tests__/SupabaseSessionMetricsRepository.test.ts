import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';
import { SupabaseSessionMetricsRepository } from '../SupabaseSessionMetricsRepository';

describe('Integration | SupabaseSessionMetricsRepository', () => {
    const repo = new SupabaseSessionMetricsRepository(supabaseClient as any);

    beforeAll(async () => {
        await initBiometricsTestDatabase();
    });

    it('returns sessions and intervals', async () => {
        const seed = await initBiometricsTestDatabase();
        const ctx = await repo.getFullSessionContext(seed.patientDbId);

        expect(Array.isArray(ctx.sessions)).toBe(true);
        expect(ctx.sessions.length).toBeGreaterThan(0);
        expect(Array.isArray(ctx.intervals)).toBe(true);
        expect(ctx.intervals.length).toBeGreaterThan(0);
    });

    it('returns biometrics within range', async () => {
        const seed = await initBiometricsTestDatabase();
        const rows = await repo.getBiometricData(seed.windows.pre.start, seed.windows.post.end);

        expect(Array.isArray(rows)).toBe(true);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0]).toHaveProperty('timestamp_iso');
        expect(rows[0]).toHaveProperty('pulse_rate_bpm');
    });
});
