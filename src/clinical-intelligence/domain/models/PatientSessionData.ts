export interface PatientSessionData {
    patientId: number;
    name: string;
    sessionId: number;
    sessionStatus: string;
    assignedDate: string;
    sessionUpdate: string | null;
    postEval: number;
}
