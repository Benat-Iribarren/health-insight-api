import { StatsRepository, PatientStats } from "../../domain/interfaces/StatsRepository";
import { DBClientService } from "@src/common/infrastructure/database/supabaseClient";

export class SupabaseStatsRepository implements StatsRepository {
    constructor(private readonly supabase: DBClientService) {}

    async getPatientStats(patientId: number): Promise<PatientStats> {
        const { data: patient, error: pError } = await this.supabase
            .from('Patient')
            .select('email')
            .eq('id', patientId)
            .single();

        if (pError || !patient) throw new Error("PATIENT_NOT_FOUND");

        const { data: sessions, error: sError } = await this.supabase
            .from('PatientSession')
            .select('state')
            .eq('patient_id', patientId);

        if (sError) throw new Error("STATS_QUERY_ERROR");

        const stats: PatientStats = {
            email: patient.email,
            completed: 0,
            inProgress: 0,
            notStarted: 0
        };

        sessions?.forEach(session => {
            if (session.state === 'completed') stats.completed++;
            else if (session.state === 'in_progress') stats.inProgress++;
            else if (session.state === 'not_started') stats.notStarted++;
        });

        return stats;
    }
}