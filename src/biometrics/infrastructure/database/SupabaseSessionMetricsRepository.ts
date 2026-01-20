import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: string) {
        // 1. Obtenemos las sesiones del paciente (filtrando por una si se provee sessionId)
        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation, assigned_date')
            .eq('patient_id', patientId);

        if (sessionId) {
            sessionQuery = sessionQuery.eq('id', parseInt(sessionId));
        }

        const { data: sessions } = await sessionQuery;

        // 2. Obtenemos los intervalos del paciente (filtrando por una si se provee sessionId)
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

    async getBiometricData(start: string, end: string) {
        // Acceso a BiometricMinutes únicamente por rango de tiempo global
        return this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', { ascending: true });
    }
}