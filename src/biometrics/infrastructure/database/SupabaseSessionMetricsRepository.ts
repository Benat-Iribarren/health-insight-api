import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: string) {
        const { data: sessions } = await this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation, assigned_date')
            .eq('patient_id', patientId);

        let intervalsQuery = this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId);

        if (sessionId) {
            intervalsQuery = intervalsQuery.eq('session_id', parseInt(sessionId));
        }

        const { data: intervals } = await intervalsQuery.order('start_minute_utc', { ascending: true });

        return {
            sessions: sessions || [],
            intervals: intervals || []
        };
    }

    async getBiometricData(patientId: number, start: string, end: string) {
        return this.client
            .from('BiometricMinutes')
            .select('*')
            .eq('patient_id', patientId)
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', { ascending: true });
    }
}