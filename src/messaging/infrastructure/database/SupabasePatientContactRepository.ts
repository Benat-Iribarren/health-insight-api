import { PatientContactRepository } from "../../domain/interfaces/PatientContactRepository";
import { DBClientService } from "@common/infrastructure/database/supabaseClient";

export class SupabasePatientContactRepository implements PatientContactRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getEmailByPatientId(patientId: number): Promise<string | null> {
        const { data, error } = await this.supabase
            .from("Patient")
            .select("email")
            .eq("id", patientId)
            .single();

        if (error || !data?.email) return null;

        return data.email;
    }
}