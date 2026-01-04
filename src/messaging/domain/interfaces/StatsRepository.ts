export interface RawSessionData {
    patient_id: number;
    patient_name: string;
    email: string;
    state: string;
    assigned_date: string;
}

export interface StatsRepository {
    getSessionsInRange(startDate: Date, endDate: Date): Promise<RawSessionData[]>;
}