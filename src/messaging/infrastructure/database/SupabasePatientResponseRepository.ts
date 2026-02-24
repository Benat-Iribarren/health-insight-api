import { PatientResponseRepository, PatientResponse } from '../../domain/interfaces/PatientResponseRepository';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

type PatientResponseRow = {
    id: string;
    patient_id: number;
    subject: string;
    message_id: string;
    is_read: boolean;
    created_at: string;
};

export class SupabasePatientResponseRepository implements PatientResponseRepository {
    constructor(private readonly supabase: DBClientService) {}

    async saveResponse(patientId: number, subject: string, messageId: string): Promise<void> {
        const { error } = await this.supabase.from('PatientResponses').insert({
            patient_id: patientId,
            subject,
            message_id: messageId,
            is_read: false,
        });

        if (error) throw error;
    }

    async getAllResponses(): Promise<PatientResponse[]> {
        const { data, error } = await this.supabase
            .from('PatientResponses')
            .select('id, patient_id, subject, message_id, is_read, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return ((data ?? []) as PatientResponseRow[]) as PatientResponse[];
    }

    async markAsReadById(responseId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('PatientResponses')
            .update({ is_read: true })
            .eq('id', responseId)
            .select('id')
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }

    async deleteById(responseId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('PatientResponses')
            .delete()
            .eq('id', responseId)
            .select('id')
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }

    async existsByMessageId(messageId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('PatientResponses')
            .select('id')
            .eq('message_id', messageId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }

    async getMessageIdByResponseId(responseId: string): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('PatientResponses')
            .select('message_id')
            .eq('id', responseId)
            .maybeSingle();

        if (error) throw error;
        return (data?.message_id as string | undefined) ?? null;
    }
}