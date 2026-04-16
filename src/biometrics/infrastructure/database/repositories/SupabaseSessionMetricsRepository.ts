import { SupabaseClient } from '@supabase/supabase-js';
import { SessionMetricsRepository } from '../../../domain/interfaces/SessionMetricsRepository';
import { Session } from '../../../domain/models/Session';
import { ContextInterval } from '../../../domain/models/ContextInterval';
import { BiometricSample } from '../../../domain/models/BiometricSample';
import { mapSession } from '../mappers/mapSession';
import { mapContextInterval } from '../mappers/mapContextInterval';
import { mapBiometricSample } from '../mappers/mapBiometricSample';

export class SupabaseSessionMetricsRepository implements SessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(
        patientId: number,
        sessionId?: number,
        limit = 10,
        offset = 0
    ): Promise<{ sessions: Session[]; intervals: ContextInterval[]; total: number }> {
        let sessionQuery = this.client
            .from('PatientSession')
            .select('session_id, state, pre_evaluation, post_evaluation, assigned_date', {
                count: 'exact',
            })
            .eq('patient_id', patientId)
            .eq('state', 'completed')
            .order('session_id', { ascending: false });

        if (sessionId !== undefined) {
            sessionQuery = sessionQuery.eq('session_id', sessionId);
        } else {
            sessionQuery = sessionQuery.range(offset, offset + limit - 1);
        }

        const { data: sessionsData, count, error: sessionError } = await sessionQuery;

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionsData || sessionsData.length === 0) {
            return { sessions: [], intervals: [], total: 0 };
        }

        const sessions = sessionsData.map(mapSession);
        const totalCount = count !== null ? count : sessions.length;

        let intervalsQuery = this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId)
            .order('start_minute_utc', { ascending: true });

        if (sessionId !== undefined) {
            intervalsQuery = intervalsQuery.eq('session_id', sessionId);
        } else {
            const validSessionIds = sessions
                .map((s) => s.sessionId)
                .filter((id): id is number => id !== null && !Number.isNaN(id));

            if (validSessionIds.length === 0) {
                return { sessions, intervals: [], total: totalCount };
            }

            intervalsQuery = intervalsQuery.in('session_id', validSessionIds);
        }

        const { data: intervalsData, error: intervalsError } = await intervalsQuery;

        if (intervalsError) {
            throw intervalsError;
        }

        const intervals = (intervalsData ?? []).map(mapContextInterval);

        return { sessions, intervals, total: totalCount };
    }

    async getBiometricData(startIso: string, endIso: string): Promise<BiometricSample[]> {
        const { data, error } = await this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', startIso)
            .lte('timestamp_iso', endIso)
            .order('timestamp_iso', { ascending: true });

        if (error) {
            console.error('BiometricMinutes query failed', { startIso, endIso, error });
            throw error;
        }

        if (!data) {
            return [];
        }

        return data.map(mapBiometricSample);
    }
}