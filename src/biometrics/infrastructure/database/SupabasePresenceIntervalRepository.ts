import { SupabaseClient } from '@supabase/supabase-js';
import { PresenceIntervalRepository } from '../../domain/interfaces/PresenceIntervalRepository';
import { PresenceInterval, ContextType } from '../../domain/models/PresenceInterval';

export class SupabasePresenceIntervalRepository implements PresenceIntervalRepository {
    readonly ContextType = { dashboard: 'dashboard', session: 'session' } as const;

    constructor(private readonly client: SupabaseClient) {}

    async findLatestByPatient(patientId: number): Promise<PresenceInterval | null> {
        const { data, error } = await this.client
            .from('ContextIntervals')
            .select('*')
            .eq('patient_id', patientId)
            .order('start_minute_utc', { ascending: false })
            .limit(1);

        if (error || !data?.length) return null;
        return this.mapToDomain(data[0]);
    }

    async extendInterval(id: number, endMinuteUtc: string): Promise<PresenceInterval> {
        const { data, error } = await this.client
            .from('ContextIntervals')
            .update({ end_minute_utc: endMinuteUtc })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapToDomain(data);
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
                attempt_no: input.attemptNo
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapToDomain(data);
    }

    private mapToDomain(row: any): PresenceInterval {
        return {
            id: row.id,
            patientId: row.patient_id,
            contextType: row.context_type as ContextType,
            sessionId: row.session_id,
            startMinuteUtc: new Date(row.start_minute_utc).toISOString(),
            endMinuteUtc: new Date(row.end_minute_utc).toISOString(),
            attemptNo: row.attempt_no
        };
    }
}