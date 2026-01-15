import { StatsRepository, PatientStats } from "../../domain/interfaces/StatsRepository";
import { DBClientService } from "@src/common/infrastructure/database/supabaseClient";

export class SupabaseStatsRepository implements StatsRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getAllPatientsStats(): Promise<PatientStats[]> {
        const { data, error } = await this.supabase
            .from('Patient')
            .select(`
                id,
                email,
                PatientSession (state)
            `);

        if (error) throw new Error("FETCH_PATIENTS_SESSIONS_ERROR");

        return (data || []).map(p => ({
            id: p.id,
            email: p.email,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            sessions: p.PatientSession
        }));
    }
}