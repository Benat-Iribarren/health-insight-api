export interface PatientStats {
    id?: number;
    email?: string;
    name?: string;
    completed: number;
    inProgress: number;
    notStarted: number;
    nextWeekSessions: number;
    sessions?: any[];
}

export interface StatsRepository {
    getAllPatientsStats(): Promise<PatientStats[]>;
    getWeeklyStats(patientId: number): Promise<PatientStats>;
}