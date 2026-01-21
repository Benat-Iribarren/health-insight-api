import { SupabaseClient } from '@supabase/supabase-js';
import { StatsRepository, PatientStats } from '../../domain/interfaces/StatsRepository';

export class SupabaseStatsRepository implements StatsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getAllPatientsStats(): Promise<PatientStats[]> {
        const { data, error } = await this.client
            .from('Patient')
            .select(`
                id,
                email,
                name,
                PatientSession (
                    state,
                    assigned_date
                )
            `);

        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            email: p.email,
            name: p.name,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            nextWeekSessions: 0,
            sessions: (p.PatientSession as any[] || []).map(s => ({
                state: s.state,
                scheduled_at: s.assigned_date
            }))
        }));
    }

    async getWeeklyStats(patientId: number): Promise<PatientStats> {
        const { data, error } = await this.client
            .from('Patient')
            .select(`
                id,
                email,
                name,
                PatientSession (
                    state,
                    assigned_date
                )
            `)
            .eq('id', patientId)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            email: data.email,
            name: data.name,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            nextWeekSessions: 0,
            sessions: (data.PatientSession as any[] || []).map(s => ({
                state: s.state,
                scheduled_at: s.assigned_date
            }))
        };
    }
}