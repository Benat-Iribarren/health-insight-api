import { ContextInterval } from '../models/ContextInterval';

export function getGlobalRange(intervals: ContextInterval[]): { globalStart: Date; globalEnd: Date } {
    const times = intervals
        .flatMap((i) => [i.startMinuteUtc.getTime(), i.endMinuteUtc.getTime()])
        .filter((t) => Number.isFinite(t));

    if (times.length === 0) {
        const now = new Date();
        return { globalStart: now, globalEnd: now };
    }

    return {
        globalStart: new Date(Math.min(...times)),
        globalEnd: new Date(Math.max(...times)),
    };
}