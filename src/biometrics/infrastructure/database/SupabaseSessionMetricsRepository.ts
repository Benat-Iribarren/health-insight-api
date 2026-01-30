import { SupabaseClient } from '@supabase/supabase-js';
import { SessionMetricsRepository, BiometricMinuteRow, ContextIntervalRow, SessionRow } from '../../domain/interfaces/SessionMetricsRepository';

export class SupabaseSessionMetricsRepository implements SessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: number) {
        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation')
            .eq('patient_id', patientId);

        if (sessionId !== undefined) sessionQuery = sessionQuery.eq('id', sessionId);

        let intervalsQuery = this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId);

        if (sessionId !== undefined) intervalsQuery = intervalsQuery.eq('session_id', sessionId);

        const [sRes, iRes] = await Promise.all([sessionQuery, intervalsQuery]);

        return {
            sessions: ((sRes.data as SessionRow[]) || []),
            intervals: ((iRes.data as ContextIntervalRow[]) || []),
        };
    }

    async getBiometricData(startIso: string, endIso: string): Promise<BiometricMinuteRow[]> {
        const { data } = await this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', startIso)
            .lte('timestamp_iso', endIso)
            .order('timestamp_iso', { ascending: true });

        return (data as BiometricMinuteRow[]) || [];
    }
}
