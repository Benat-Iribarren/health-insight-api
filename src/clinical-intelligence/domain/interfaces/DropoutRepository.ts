import { PatientSessionData } from '../models/PatientSessionData';

export interface DropoutRepository {
    getPatientSessionData(patientId?: number): Promise<PatientSessionData[]>;
}