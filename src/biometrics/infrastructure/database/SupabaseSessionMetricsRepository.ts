import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseSessionMetricsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getFullSessionContext(patientId: number, sessionId?: string) {
        // 1. Consulta de sesiones: Filtra por paciente y opcionalmente por sesión
        let sessionQuery = this.client
            .from('PatientSession')
            .select('id, state, pre_evaluation, post_evaluation, assigned_date')
            .eq('patient_id', patientId);

        if (sessionId) {
            sessionQuery = sessionQuery.eq('id', parseInt(sessionId));
        }

        // 2. Consulta de intervalos: Siempre ordenados para facilitar el cálculo de ventanas temporales
        let intervalsQuery = this.client
            .from('ContextIntervals')
            .select('start_minute_utc, end_minute_utc, context_type, session_id')
            .eq('patient_id', patientId);

        if (sessionId) {
            intervalsQuery = intervalsQuery.eq('session_id', parseInt(sessionId));
        }

        const [{ data: sessions }, { data: intervals }] = await Promise.all([
            sessionQuery,
            intervalsQuery.order('start_minute_utc', { ascending: true })
        ]);

        return {
            sessions: sessions || [],
            intervals: intervals || []
        };
    }

    async getBiometricData(start: string, end: string) {
        // Acceso global por rango de tiempo.
        // Importante: usamos gte/lte sobre la columna normalizada en la DB.
        return this.client
            .from('BiometricMinutes')
            .select('*')
            .gte('timestamp_iso', start)
            .lte('timestamp_iso', end)
            .order('timestamp_iso', { ascending: true });
    }
}