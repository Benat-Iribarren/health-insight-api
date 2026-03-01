import { ContextInterval } from '../models/ContextInterval';

export function selectSessionIntervals(
    intervals: ContextInterval[],
    sessionStart: Date,
    sessionEnd: Date
): { preInt?: ContextInterval; postInt?: ContextInterval } {
    const sessionStartMs = sessionStart.getTime();
    const sessionEndMs = sessionEnd.getTime();
    const MAX_GAP_MS = 2 * 60 * 1000;

    const preIntCandidate = intervals
        .filter(
            (i) =>
                i.contextType === 'dashboard' &&
                i.endMinuteUtc.getTime() <= sessionStartMs + MAX_GAP_MS
        )
        .sort((a, b) => b.endMinuteUtc.getTime() - a.endMinuteUtc.getTime())[0];

    const postIntCandidate = intervals
        .filter(
            (i) =>
                i.contextType === 'dashboard' &&
                i.startMinuteUtc.getTime() >= sessionEndMs - MAX_GAP_MS
        )
        .sort((a, b) => a.startMinuteUtc.getTime() - b.startMinuteUtc.getTime())[0];

    return { preInt: preIntCandidate, postInt: postIntCandidate };
}