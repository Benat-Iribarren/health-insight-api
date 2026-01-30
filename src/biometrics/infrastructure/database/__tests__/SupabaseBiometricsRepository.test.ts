import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { SupabaseBiometricsRepository } from '../SupabaseBiometricsRepository';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

describe('Integration | SupabaseBiometricsRepository', () => {
    const repo = new SupabaseBiometricsRepository(supabaseClient as any);

    beforeAll(async () => {
        await initBiometricsTestDatabase();
    });

    it('upserts by timestamp_iso', async () => {
        const ts = '2026-01-01T12:00:00.000Z';

        await repo.upsertBiometricMinutes([
            {
                timestamp_iso: ts,
                timestamp_unix_ms: new Date(ts).getTime(),
                pulse_rate_bpm: 75,
                eda_scl_usiemens: 1.1,
                temperature_celsius: 36.6,
                accel_std_g: 0.02,
                respiratory_rate_brpm: 15,
                body_position_type: 'right',
            } as any,
        ]);

        const { data } = await supabaseClient.from('BiometricMinutes').select('*').eq('timestamp_iso', ts).single();

        expect(data).toBeTruthy();
        expect(data!.pulse_rate_bpm).toBe(75);
        expect(data!.body_position_type).toBe('right');
    });
});