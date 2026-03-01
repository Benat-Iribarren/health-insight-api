import { BiometricSample } from '../models/BiometricSample';

type Stats = { avg: number; max: number; min: number };

export type MetricSummary = {
    edaSclUsiemens: { pre: Stats; session: Stats; post: Stats };
    pulseRateBpm: { pre: Stats; session: Stats; post: Stats };
    temperatureCelsius: { pre: Stats; session: Stats; post: Stats };
};

const emptyStats = (): Stats => ({ avg: 0, min: 0, max: 0 });

function inRange(t: number, start?: Date, end?: Date) {
    const s = start?.getTime();
    const e = end?.getTime();
    if (s == null || e == null) return false;
    return t >= s && t <= e;
}

function getStats(
    data: BiometricSample[],
    pick: (b: BiometricSample) => number | null,
    start?: Date,
    end?: Date
): Stats {
    if (!start || !end) return emptyStats();

    const values = data
        .filter((b) => inRange(b.timestamp.getTime(), start, end))
        .map(pick)
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    if (values.length === 0) return emptyStats();

    const sum = values.reduce((a, b) => a + b, 0);
    return {
        avg: Number((sum / values.length).toFixed(2)),
        min: Math.min(...values),
        max: Math.max(...values),
    };
}

export function calculateMetrics(
    data: BiometricSample[],
    preStart?: Date,
    preEnd?: Date,
    postStart?: Date,
    postEnd?: Date,
    sessionStart?: Date,
    sessionEnd?: Date
): MetricSummary {
    return {
        edaSclUsiemens: {
            pre: getStats(data, (b) => b.edaSclUsiemens, preStart, preEnd),
            session: getStats(data, (b) => b.edaSclUsiemens, sessionStart, sessionEnd),
            post: getStats(data, (b) => b.edaSclUsiemens, postStart, postEnd),
        },
        pulseRateBpm: {
            pre: getStats(data, (b) => b.pulseRateBpm, preStart, preEnd),
            session: getStats(data, (b) => b.pulseRateBpm, sessionStart, sessionEnd),
            post: getStats(data, (b) => b.pulseRateBpm, postStart, postEnd),
        },
        temperatureCelsius: {
            pre: getStats(data, (b) => b.temperatureCelsius, preStart, preEnd),
            session: getStats(data, (b) => b.temperatureCelsius, sessionStart, sessionEnd),
            post: getStats(data, (b) => b.temperatureCelsius, postStart, postEnd),
        },
    };
}