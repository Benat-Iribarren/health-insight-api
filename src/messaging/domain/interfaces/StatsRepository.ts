import { Stats } from '../models/Stats';

export interface StatsRepository {
    getAllPatientsStats(): Promise<Stats[]>;
    getWeeklyStats(patientId: number): Promise<Stats>;
}