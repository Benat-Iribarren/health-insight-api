export interface SessionInfo {
    state: string;
    assignedDate: string;
}

export interface Stats {
    patientId: number;
    email: string | null;
    name: string | null;
    sessions: SessionInfo[];
}