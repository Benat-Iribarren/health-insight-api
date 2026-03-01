import { ContextInterval } from '../../../domain/models/ContextInterval';

export function mapContextInterval(r: any): ContextInterval {
    return {
        startMinuteUtc: new Date(r.start_minute_utc),
        endMinuteUtc: new Date(r.end_minute_utc),
        contextType: r.context_type,
        sessionId: r.session_id ?? null,
    };
}