export interface DropoutRepository {
    getPatientSessionData(patientId?: string): Promise<any[]>;
}