import { PatientContactRepository } from "../../domain/interfaces/PatientContactRepository";
import { DBClientService } from "@src/common/infrastructure/database/supabaseClient";

export class SupabasePatientContactRepository implements PatientContactRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getEmailByPatientId(patientId: number): Promise<string | null> {
        // Aseguramos que patientId sea tratado como número para la consulta int8
        const targetId = Number(patientId);

        const { data, error } = await this.supabase
            .from('Patient')
            .select('email')
            .eq('id', targetId)
            .maybeSingle();

        if (error) {
            console.error(`❌ Error en Supabase (ID ${targetId}):`, error.message);
            return null;
        }

        if (!data || !data.email) {
            console.warn(`⚠️ No se encontró email para el paciente ID: ${targetId}`);
            return null;
        }

        return data.email;
    }
}