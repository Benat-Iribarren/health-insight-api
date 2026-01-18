import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@common/infrastructure/database/supabaseTypes';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient<Database>) {}

    async getFullSessionContext(userId: string, patientId: number, sessionId: string) {
        const [sessionRes, intervalsRes] = await Promise.all([
            this.client
                .from('PatientSession')
                .select('state, pre_evaluation, post_evaluation')
                .eq('id', parseInt(sessionId))
                .eq('patient_id', patientId)
                .single(),
            this.client
                .from('ContextIntervals')
                .select('start_minute_utc, end_minute_utc, context_type, session_id')
                .eq('user_id', userId)
                .or(`session_id.eq.${sessionId},context_type.eq.dashboard`)
                .order('start_minute_utc', { ascending: true })
        ]);

        return { session: sessionRes.data, intervals: intervalsRes.data };
    }

    async getBiometricData(start: string, end: string) {
        return await this.client
            .from('BiometricMinutes')
            .select('timestamp_iso, eda_scl_usiemens, pulse_rate_bpm, temperature_celsius, accel_std_g, respiratory_rate_brpm')
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', { ascending: true });
    }
}