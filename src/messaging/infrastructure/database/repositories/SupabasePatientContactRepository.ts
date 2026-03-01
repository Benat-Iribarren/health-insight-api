import { PatientContactRepository } from '../../../domain/interfaces/PatientContactRepository';
import { DBClientService } from '@common/infrastructure/database/supabaseClient';

export class SupabasePatientContactRepository implements PatientContactRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getPatientContact(patientId: number): Promise<{ email: string | null; name: string | null }> {
        const { data, error } = await this.supabase
            .from('Patient')
            .select('email, name')
            .eq('id', patientId)
            .maybeSingle();

        if (error || !data) return { email: null, name: null };

        return {
            email: data.email ?? null,
            name: data.name ?? null,
        };
    }

    async getAllPatientsContacts(): Promise<Array<{ id: number; email: string | null; name: string | null }>> {
        const { data, error } = await this.supabase.from('Patient').select('id, email, name');

        if (error || !data) return [];

        return (data as any[]).map((p) => ({
            id: Number(p.id),
            email: p.email ?? null,
            name: p.name ?? null,
        }));
    }
}