export interface PatientStats {
    id?: number;
    email: string;
    completed: number;
    inProgress: number;
    notStarted: number;
    nextWeekCount: number;
    sessions?: { state: string; assigned_date: string }[];
}

export interface StatsRepository {
    getAllPatientsStats(): Promise<PatientStats[]>;
}