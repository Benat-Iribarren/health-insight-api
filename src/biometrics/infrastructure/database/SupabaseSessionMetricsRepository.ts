import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@src/common/infrastructure/database/supabaseTypes';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient<Database>) {}

    async getSessionData(patientId: number, sessionId: string) {
        return await this.client
            .from('PatientSession')
            .select('state, pre_evaluation, post_evaluation')
            .eq('id', parseInt(sessionId))
            .eq('patient_id', patientId)
            .single();
    }

    async getContextIntervals(patientId: number, sessionId: string) {
        return await this.client
            .from('ContextIntervals')
            .select('*')
            .eq('patient_id', patientId.toString())
            .or(`session_id.eq.${sessionId},context_type.eq.dashboard`)
            .order('start_minute_utc', { ascending: true });
    }

    async getBiometricData(patientId: number, start: string, end: string) {
        return await this.client
            .from('ContextIntervals')
            .select('*')
            .eq('patient_id', patientId.toString())
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end);
    }
}