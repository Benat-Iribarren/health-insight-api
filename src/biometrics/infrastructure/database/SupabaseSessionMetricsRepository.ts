import { SupabaseClient } from '@supabase/supabase-js';
import {
    SessionMetricsRepository,
    BiometricMinuteRow,
    ContextIntervalRow,
    SessionRow,
} from '../../domain/interfaces/SessionMetricsRepository';

export class SupabaseSessionMetricsRepository implements SessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: number, limit = 10, offset = 0) {
        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, session_id, state, pre_evaluation, post_evaluation, assigned_date', { count: 'exact' })
            .eq('patient_id', patientId)
            .eq('state', 'completed')
            .order('session_id', { ascending: false });

        if (sessionId !== undefined) {
            sessionQuery = sessionQuery.eq('session_id', sessionId);
        } else {
            sessionQuery = sessionQuery.range(offset, offset + limit - 1);
        }

        const { data: sessionsData, count, error } = await sessionQuery;

        if (error || !sessionsData || sessionsData.length === 0) {
            return { sessions: [], intervals: [], total: 0 };
        }

        const sessions = sessionsData as SessionRow[];
        const sessionIds = sessions.map((s) => Number(s.session_id)).filter((v) => Number.isFinite(v));

        const { data: intervalsData, error: intervalsError } = await this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId)
            .or(`session_id.in.(${sessionIds.join(',')}),context_type.eq.dashboard`)
            .order('start_minute_utc', { ascending: true });

        if (intervalsError) {
            return { sessions, intervals: [], total: count || 0 };
        }

        return {
            sessions,
            intervals: (intervalsData as ContextIntervalRow[]) || [],
            total: count || 0,
        };
    }

    async getBiometricData(startIso: string, endIso: string): Promise<BiometricMinuteRow[]> {
        const { data, error } = await this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', startIso)
            .lte('timestamp_iso', endIso)
            .order('timestamp_iso', { ascending: true });

        if (error || !data) return [];

        return (data as any[]).map((r) => ({
            ...r,
            timestamp_unix_ms: new Date(r.timestamp_iso).getTime(),
        })) as BiometricMinuteRow[];
    }
}
