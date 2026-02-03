import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { SupabaseBiometricsRepository } from '../SupabaseBiometricsRepository';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

describe('Integration | SupabaseBiometricsRepository', () => {
    const repo = new SupabaseBiometricsRepository(supabaseClient);

    it('upserts by timestamp_iso', async () => {
        const seed = await initBiometricsTestDatabase();
        const ts = '2026-01-01T12:00:00.000Z';

        await repo.upsertBiometricMinutes([
            {
                timestamp_iso: ts,
                pulse_rate_bpm: 75,
                eda_scl_usiemens: 1.1,
                temperature_celsius: 36.6,
                accel_std_g: 0.02,
                respiratory_rate_brpm: 15,
                body_position_type: 'right',
                patient_id: seed.patientId
            },
        ]);

        const { data } = await supabaseClient.from('BiometricMinutes').select('*').eq('timestamp_iso', ts).single();

        expect(data).toBeTruthy();
        expect(Number(data!.pulse_rate_bpm)).toBe(75);
        expect(data!.body_position_type).toBe('right');
    });
});