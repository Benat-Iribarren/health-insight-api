import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: string) {
        // 1. Obtenemos las sesiones del paciente
        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation, assigned_date')
            .eq('patient_id', patientId);

        if (sessionId) {
            sessionQuery = sessionQuery.eq('id', parseInt(sessionId));
        }

        const { data: sessions, error: sErr } = await sessionQuery;
        if (sErr) throw sErr;

        // 2. Obtenemos los intervalos del paciente
        let intervalsQuery = this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId);

        if (sessionId) {
            intervalsQuery = intervalsQuery.eq('session_id', parseInt(sessionId));
        }

        const { data: intervals, error: iErr } = await intervalsQuery.order('start_minute_utc', { ascending: true });
        if (iErr) throw iErr;

        return {
            sessions: sessions || [],
            intervals: intervals || []
        };
    }

    async getBiometricData(start: string, end: string) {
        // Obtenemos biometría basándonos puramente en el rango de tiempo
        return this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', { ascending: true });
    }
}