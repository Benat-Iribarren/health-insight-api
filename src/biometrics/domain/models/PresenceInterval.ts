export type ContextType = 'dashboard' | 'session';

export interface PresenceInterval {
    id: number;
    patientId: number;
    contextType: ContextType;
    sessionId: number | null;
    startMinuteUtc: string;
    endMinuteUtc: string;
    attemptNo?: number | null;
}