import { PatientContactRepository } from "../../domain/interfaces/PatientContactRepository";
import { DBClientService } from "@src/common/infrastructure/database/supabaseClient";

export class SupabasePatientContactRepository implements PatientContactRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getEmailByPatientId(patientId: number): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('Patient')
            .select('email')
            .eq('id', patientId)
            .maybeSingle();

        if (error) return null;
        return data?.email ?? null;
    }
}