import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: string) {
        const { data: patient } = await this.client
            .from('Patient')
            .select('user_id')
            .eq('id', patientId)
            .single();

        if (!patient?.user_id) throw new Error('PATIENT_USER_ID_NOT_FOUND');

        const { data: sessions } = await this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation, assigned_date')
            .eq('patient_id', patientId);

        const { data: intervals } = await this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('user_id', patient.user_id)
            .order('start_minute_utc', { ascending: true });

        return {
            sessions: sessions || [],
            intervals: intervals || []
        };
    }

    async getBiometricData(start: string, end: string) {
        return await this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', { ascending: true });
    }
}