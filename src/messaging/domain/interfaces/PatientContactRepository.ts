export interface PatientContactRepository {
    getPatientContact(patientId: number): Promise<{ email: string | null; name: string | null }>;
    getAllPatientsContacts(): Promise<Array<{ id: number; email: string | null; name: string | null }>>;
}