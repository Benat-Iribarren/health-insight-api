import { SupabaseClient } from '@supabase/supabase-js';
import { PresenceIntervalRepository } from '../../domain/interfaces/PresenceIntervalRepository';
import { PresenceInterval } from '../../domain/models/PresenceInterval';

export class SupabasePresenceIntervalRepository implements PresenceIntervalRepository {
    ContextType = { dashboard: 'dashboard', session: 'session' } as const;

    constructor(private readonly client: SupabaseClient) {}

    async findLatestByPatient(patientId: string): Promise<PresenceInterval | null> {
        const { data, error } = await this.client
            .from('ContextIntervals')
            .select('id, patient_id, context_type, session_id, start_minute_utc, end_minute_utc, attempt_no')
            .eq('patient_id', patientId)
            .order('start_minute_utc', { ascending: false })
            .limit(1);

        if (error) throw error;
        const row = data?.[0];
        if (!row) return null;

        return {
            id: String(row.id),
            patientId: String(row.patient_id),
            contextType: row.context_type as any,
            sessionId: row.session_id ? String(row.session_id) : null,
            startMinuteUtc: row.start_minute_utc,
            endMinuteUtc: row.end_minute_utc,
            attemptNo: row.attempt_no ?? null,
        };
    }

    async extendInterval(id: string, endMinuteUtc: string): Promise<PresenceInterval> {
        const { data, error } = await this.client
            .from('ContextIntervals')
            .update({ end_minute_utc: endMinuteUtc })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: String(data.id),
            patientId: String(data.patient_id),
            contextType: data.context_type,
            sessionId: data.session_id ? String(data.session_id) : null,
            startMinuteUtc: data.start_minute_utc,
            endMinuteUtc: data.end_minute_utc,
            attemptNo: data.attempt_no ?? null,
        };
    }

    async createInterval(input: Omit<PresenceInterval, 'id'>): Promise<PresenceInterval> {
        const { data, error } = await this.client
            .from('ContextIntervals')
            .insert({
                patient_id: input.patientId,
                context_type: input.contextType,
                session_id: input.sessionId,
                start_minute_utc: input.startMinuteUtc,
                end_minute_utc: input.endMinuteUtc,
                attempt_no: input.attemptNo ?? null,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: String(data.id),
            patientId: String(data.patient_id),
            contextType: data.context_type,
            sessionId: data.session_id ? String(data.session_id) : null,
            startMinuteUtc: data.start_minute_utc,
            endMinuteUtc: data.end_minute_utc,
            attemptNo: data.attempt_no ?? null,
        };
    }
}