export interface Session {
    sessionId: number;
    state: string;
    preEvaluation: number | null;
    postEvaluation: number | null;
    assignedDate: string | null;
}