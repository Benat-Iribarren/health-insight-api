import { SupabaseClient } from '@supabase/supabase-js';
import { StatsRepository } from '../../../domain/interfaces/StatsRepository';
import { Stats } from '../../../domain/models/Stats';
import { StatsRow, mapStatsRow } from '../mappers/mapStatsRow';

export class SupabaseStatsRepository implements StatsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getAllPatientsStats(): Promise<Stats[]> {
        const { data, error } = await this.client
            .from('Patient')
            .select('id, email, name, PatientSession(state, assigned_date)');

        if (error) throw error;
        return ((data as unknown as StatsRow[]) || []).map(mapStatsRow);
    }

    async getWeeklyStats(patientId: number): Promise<Stats> {
        const { data, error } = await this.client
            .from('Patient')
            .select('id, email, name, PatientSession(state, assigned_date)')
            .eq('id', patientId)
            .single();

        if (error) throw error;
        return mapStatsRow(data as unknown as StatsRow);
    }
}