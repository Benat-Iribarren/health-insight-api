export interface PatientSessionData {
    patientId: number;
    name: string;
    sessionId: number;
    sessionStatus: string;
    assignedDate: string | null;
    completedDate: string | null;
    sessionUpdate: string | null;
    postEval: number;
}