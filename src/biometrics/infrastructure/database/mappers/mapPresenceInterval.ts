import { PresenceInterval, ContextType } from '../../../domain/models/PresenceInterval';

export function mapPresenceInterval(r: any): PresenceInterval {
    return {
        id: Number(r.id),
        patientId: Number(r.patient_id),
        contextType: r.context_type as ContextType,
        sessionId: r.session_id ?? null,
        startMinuteUtc: String(r.start_minute_utc),
        endMinuteUtc: String(r.end_minute_utc),
        attemptNo: r.attempt_no ?? null,
    };
}