export type ContextType = 'dashboard' | 'session';

export interface ContextInterval {
    startMinuteUtc: Date;
    endMinuteUtc: Date;
    contextType: ContextType;
    sessionId: number | null;
}