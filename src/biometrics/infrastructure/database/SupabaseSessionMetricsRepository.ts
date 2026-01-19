import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@common/infrastructure/database/supabaseTypes';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient<Database>) {}

    async getFullSessionContext(patientId: number, sessionId?: string) {
        const { data: patient } = await this.client
            .from('Patient')
            .select('user_id')
            .eq('id', patientId)
            .single();

        if (!patient?.user_id) throw new Error('PATIENT_USER_ID_NOT_FOUND');

        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation')
            .eq('patient_id', patientId);

        if (sessionId) {
            sessionQuery = sessionQuery.eq('id', parseInt(sessionId));
        }

        const [sessionsRes, intervalsRes] = await Promise.all([
            sessionQuery,
            this.client
                .from('ContextIntervals')
                .select('start_minute_utc, end_minute_utc, context_type, session_id')
                .eq('user_id', patient.user_id)
                .order('start_minute_utc', { ascending: true })
        ]);

        return {
            sessions: sessionsRes.data || [],
            intervals: intervalsRes.data || []
        };
    }

    async getBiometricData(start: string, end: string) {
        return this.client
            .from('BiometricMinutes')
            .select('timestamp_iso, eda_scl_usiemens, pulse_rate_bpm, temperature_celsius, accel_std_g, respiratory_rate_brpm')
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', {ascending: true});
    }
}