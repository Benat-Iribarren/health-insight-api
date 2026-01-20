import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: string) {
        // 1. Sesiones del paciente
        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation')
            .eq('patient_id', patientId);

        if (sessionId) sessionQuery = sessionQuery.eq('id', parseInt(sessionId));

        // 2. Intervalos del paciente
        let intervalsQuery = this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId);

        if (sessionId) intervalsQuery = intervalsQuery.eq('session_id', parseInt(sessionId));

        const [sRes, iRes] = await Promise.all([sessionQuery, intervalsQuery]);

        return {
            sessions: sRes.data || [],
            intervals: iRes.data || []
        };
    }

    async getBiometricData(start: string, end: string) {
        // Log para ver qué fechas estamos pidiendo exactamente a Supabase
        console.error(`SQL_QUERY: gte.${start} lte.${end}`);

        return this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', { ascending: true });
    }
}