import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseBiometricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async upsertBiometricMinutes(minutes: any[]) {
        const toInsert = minutes.map(m => ({
            timestamp_iso: m.timestamp_iso,
            patient_id: m.patient_id,
            pulse_rate_bpm: m.pulse_rate_bpm,
            eda_scl_usiemens: m.eda_scl_usiemens,
            temperature_celsius: m.temperature_celsius,
            accel_std_g: m.accel_std_g,
            body_position_type: m.body_position_type,
            respiratory_rate_brpm: m.respiratory_rate_brpm
        }));

        const { error } = await this.client
            .from('BiometricMinutes')
            .upsert(toInsert, { onConflict: 'timestamp_iso' });

        if (error) throw error;
    }
}