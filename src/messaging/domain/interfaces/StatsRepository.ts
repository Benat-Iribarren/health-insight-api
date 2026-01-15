export interface PatientStats {
    email: string;
    completed: number;
    inProgress: number;
    notStarted: number;
}

export interface StatsRepository {
    getPatientStats(patientId: number): Promise<PatientStats>;
}