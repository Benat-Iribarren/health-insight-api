import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { SupabaseBiometricMinutesRepository } from '../repositories/SupabaseBiometricMinutesRepository';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

describe('Integration | SupabaseBiometricsRepository', () => {
    const repo = new SupabaseBiometricMinutesRepository(supabaseClient);

    it('upserts by timestamp_iso', async () => {
        const seed = await initBiometricsTestDatabase();
        const ts = new Date('2026-01-01T12:00:00.000Z');

        await repo.upsertBiometricMinutes([
            {
                timestamp: ts,
                pulseRateBpm: 75,
                edaSclUsiemens: 1.1,
                temperatureCelsius: 36.6,
                accelStdG: 0.02,
                respiratoryRateBrpm: 15,
                bodyPositionType: 'right',
            } as any,
        ]);

        const { data } = await supabaseClient.from('BiometricMinutes').select('*').eq('timestamp_iso', ts.toISOString()).single();

        expect(data).toBeTruthy();
        expect(Number(data!.pulse_rate_bpm)).toBe(75);
        expect(data!.body_position_type).toBe('right');
    });
});