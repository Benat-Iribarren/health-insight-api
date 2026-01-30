import { ContextType, PresenceInterval } from '../models/PresenceInterval';

export interface PresenceIntervalRepository {
    findLatestByPatient(patientId: string): Promise<PresenceInterval | null>;
    extendInterval(id: string, endMinuteUtc: string): Promise<PresenceInterval>;
    createInterval(input: Omit<PresenceInterval, 'id'>): Promise<PresenceInterval>;
    ContextType: {
        dashboard: ContextType;
        session: ContextType;
    };
}
