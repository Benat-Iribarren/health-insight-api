import { StatsRepository, RawSessionData } from "../../domain/interfaces/StatsRepository";
import { DBClientService } from "@common/infrastructure/database/supabaseClient";

export class SupabaseStatsRepository implements StatsRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getSessionsInRange(startDate: Date, endDate: Date): Promise<RawSessionData[]> {
        const { data, error } = await this.supabase
            .from('PatientSession')
            .select(`
                state,
                assigned_date,
                patient_id,
                Patient!inner ( 
                    name, 
                    email 
                )
            `)
            .gte('assigned_date', startDate.toISOString())
            .lte('assigned_date', endDate.toISOString());

        if (error || !data) {
            return [];
        }

        return data.map((s: any) => ({
            patient_id: s.patient_id,
            patient_name: s.Patient.name,
            email: s.Patient.email,
            state: s.state,
            assigned_date: s.assigned_date
        }));
    }
}