import { PresenceInterval } from '../models/PresenceInterval';

type Params = {
    patientId: number;
    minute: Date;
    contextType: 'dashboard' | 'session';
    sessionId: number | null;
};

export type PresenceMinuteDecision =
    | { kind: 'create'; startIso: string; endIso: string; attemptNo: number | null }
    | { kind: 'extend'; intervalId: number; newEndIso: string }
    | { kind: 'idempotent'; intervalId: number };

export function isValidUtcMinute(minute: Date): boolean {
    return !Number.isNaN(minute.getTime()) && minute.getUTCSeconds() === 0 && minute.getUTCMilliseconds() === 0;
}

export function decidePresenceMinute(last: PresenceInterval | null, params: Params): PresenceMinuteDecision {
    const startIso = params.minute.toISOString();
    const endIso = new Date(params.minute.getTime() + 60_000).toISOString();

    if (!last) {
        return {
            kind: 'create',
            startIso,
            endIso,
            attemptNo: params.contextType === 'session' ? 1 : null,
        };
    }

    if (last.contextType !== params.contextType || last.sessionId !== params.sessionId) {
        return {
            kind: 'create',
            startIso,
            endIso,
            attemptNo: params.contextType === 'session' ? 1 : null,
        };
    }

    const lastEndMs = new Date(last.endMinuteUtc).getTime();
    const currentMs = params.minute.getTime();

    if (currentMs - lastEndMs <= 60_000 && currentMs >= lastEndMs - 60_000) {
        if (new Date(endIso) > new Date(last.endMinuteUtc)) {
            return { kind: 'extend', intervalId: last.id, newEndIso: endIso };
        }
        return { kind: 'idempotent', intervalId: last.id };
    }

    return {
        kind: 'create',
        startIso,
        endIso,
        attemptNo: params.contextType === 'session' ? 1 : null,
    };
}