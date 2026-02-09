import { SupabaseClient } from '@supabase/supabase-js';
import { SessionMetricsRepository, BiometricMinuteRow, ContextIntervalRow, SessionRow } from '../../domain/interfaces/SessionMetricsRepository';

export class SupabaseSessionMetricsRepository implements SessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: number, limit = 10, offset = 0) {
        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation', { count: 'exact' })
            .eq('patient_id', patientId)
            .order('id', { ascending: false });

        if (sessionId !== undefined) {
            sessionQuery = sessionQuery.eq('id', sessionId);
        } else {
            sessionQuery = sessionQuery.range(offset, offset + limit - 1);
        }

        let intervalsQuery = this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId);

        const [sRes, iRes] = await Promise.all([sessionQuery, intervalsQuery]);

        return {
            sessions: (sRes.data as SessionRow[]) || [],
            intervals: (iRes.data as ContextIntervalRow[]) || [],
            total: sRes.count || 0
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
