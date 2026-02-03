import { ContextType, PresenceInterval } from '../models/PresenceInterval';

export interface PresenceIntervalRepository {
    findLatestByPatient(patientId: number): Promise<PresenceInterval | null>;
    extendInterval(id: number, endMinuteUtc: string): Promise<PresenceInterval>;
    createInterval(input: Omit<PresenceInterval, 'id'>): Promise<PresenceInterval>;
    ContextType: {
        dashboard: ContextType;
        session: ContextType;
    };
}