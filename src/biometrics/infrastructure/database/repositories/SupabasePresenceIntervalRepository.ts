import { SupabaseClient } from '@supabase/supabase-js';
import { PresenceIntervalRepository } from '../../../domain/interfaces/PresenceIntervalRepository';
import { PresenceInterval } from '../../../domain/models/PresenceInterval';
import { mapPresenceInterval } from '../mappers/mapPresenceInterval';

export class SupabasePresenceIntervalRepository implements PresenceIntervalRepository {
    constructor(private readonly client: SupabaseClient) {}

    async findLatestByPatient(patientId: number): Promise<PresenceInterval | null> {
        const { data, error } = await this.client
            .from('ContextIntervals')
            .select('*')
            .eq('patient_id', patientId)
            .order('start_minute_utc', { ascending: false })
            .limit(1);

        if (error || !data?.length) return null;
        return mapPresenceInterval(data[0]);
    }

    async extendInterval(id: number, endMinuteUtc: string): Promise<PresenceInterval> {
        const { data, error } = await this.client
            .from('ContextIntervals')
            .update({ end_minute_utc: endMinuteUtc })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapPresenceInterval(data);
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
                attempt_no: input.attemptNo,
            })
            .select()
            .single();

        if (error) throw error;
        return mapPresenceInterval(data);
    }
}