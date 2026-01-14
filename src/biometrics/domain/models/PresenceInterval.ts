export type ContextType = 'dashboard' | 'session';

export interface PresenceInterval {
    id?: string;
    patientId: string;
    contextType: ContextType;
    sessionId: string | null;
    startMinuteUtc: string;
    endMinuteUtc: string;
    attemptNo?: number | null;
}