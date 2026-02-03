import { SupabaseClient } from '@supabase/supabase-js';
import { StatsRepository, PatientStats } from '../../domain/interfaces/StatsRepository';

interface SupabasePatientRow {
    id: number;
    email: string;
    name: string;
    PatientSession: {
        state: string;
        assigned_date: string;
    }[];
}

export class SupabaseStatsRepository implements StatsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getAllPatientsStats(): Promise<PatientStats[]> {
        const { data, error } = await this.client
            .from('Patient')
            .select('id, email, name, PatientSession(state, assigned_date)');

        if (error) throw error;

        const patients = (data as unknown as SupabasePatientRow[]) || [];

        return patients.map(p => ({
            id: p.id,
            email: p.email,
            name: p.name,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            nextWeekSessions: 0,
            sessions: (p.PatientSession || []).map(s => ({
                state: s.state,
                scheduled_at: s.assigned_date
            }))
        }));
    }
    async getWeeklyStats(patientId: number): Promise<PatientStats> {
        const { data, error } = await this.client
            .from('Patient')
            .select('id, email, name, PatientSession(state, assigned_date)')
            .eq('id', patientId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Patient stats not found');
            }
            throw error;
        }
        if (!data) throw new Error('Patient stats not found');

        const p = data as unknown as SupabasePatientRow;

        return {
            id: p.id,
            email: p.email,
            name: p.name,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            nextWeekSessions: 0,
            sessions: (p.PatientSession || []).map(s => ({
                state: s.state,
                scheduled_at: s.assigned_date
            }))
        };
    }
}