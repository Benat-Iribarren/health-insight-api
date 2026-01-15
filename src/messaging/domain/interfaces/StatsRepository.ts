export interface PatientStats {
    id?: number;
    email: string;
    completed: number;
    inProgress: number;
    notStarted: number;
    sessions?: { state: string }[];
}

export interface StatsRepository {
    getAllPatientsStats(): Promise<PatientStats[]>;
}