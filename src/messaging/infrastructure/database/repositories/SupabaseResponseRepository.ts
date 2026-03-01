import { SupabaseClient } from '@supabase/supabase-js';
import { ResponseRepository } from '../../../domain/interfaces/ResponseRepository';
import { Response } from '../../../domain/models/Response';
import { ResponseRow, mapResponseInsert, mapResponseRow } from '../mappers/mapResponseRow';

export class SupabaseResponseRepository implements ResponseRepository {
    constructor(private readonly client: SupabaseClient) {}

    async create(input: { patientId: number; subject: string; messageId: string }): Promise<void> {
        const { error } = await this.client.from('Responses').insert(mapResponseInsert(input));
        if (error) throw error;
    }

    async listAll(): Promise<Response[]> {
        const { data, error } = await this.client
            .from('Responses')
            .select('id, patient_id, subject, message_id, is_read, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return ((data as unknown as ResponseRow[]) || []).map(mapResponseRow);
    }

    async markReadById(responseId: string): Promise<boolean> {
        const { data, error } = await this.client
            .from('Responses')
            .update({ is_read: true })
            .eq('id', responseId)
            .select('id')
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }

    async deleteById(responseId: string): Promise<boolean> {
        const { error, count } = await this.client
            .from('Responses')
            .delete({ count: 'exact' })
            .eq('id', responseId);

        if (error) throw error;
        return (count || 0) > 0;
    }

    async getMessageIdByResponseId(responseId: string): Promise<string | null> {
        const { data, error } = await this.client
            .from('Responses')
            .select('message_id')
            .eq('id', responseId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        return String((data as any).message_id ?? null);
    }

    async existsByMessageId(messageId: string): Promise<boolean> {
        const { data, error } = await this.client
            .from('Responses')
            .select('id')
            .eq('message_id', messageId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }
}