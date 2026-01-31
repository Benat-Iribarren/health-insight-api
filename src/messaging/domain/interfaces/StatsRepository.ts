export type SessionState = "completed" | "in_progress" | "not_started";

export interface PatientSession {
    state: SessionState | string;
    scheduled_at: string;
}

export interface PatientStats {
    id?: number;
    email?: string;
    name?: string;
    completed: number;
    inProgress: number;
    notStarted: number;
    nextWeekSessions: number;
    sessions?: PatientSession[];
}

export interface StatsRepository {
    getAllPatientsStats(): Promise<PatientStats[]>;
    getWeeklyStats(patientId: number): Promise<PatientStats>;
}
