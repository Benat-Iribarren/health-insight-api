export interface PatientContactRepository {
    getEmailByPatientId(patientId: number): Promise<string | null>;
}
