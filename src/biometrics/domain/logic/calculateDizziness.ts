import { Session } from '../models/Session';
import { MetricSummary } from './calculateMetrics';

type Stats = { avg: number; max: number; min: number };

function clamp(value: number, min = 0, max = 100): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
}

function normalize(value: number, min: number, max: number): number {
    if (!Number.isFinite(value) || max <= min) return 0;
    return clamp(((value - min) / (max - min)) * 100);
}

function weightedAverage(values: Array<{ value: number; weight: number }>): number {
    const valid = values.filter((v) => Number.isFinite(v.value) && Number.isFinite(v.weight) && v.weight > 0);
    if (!valid.length) return 0;

    const totalWeight = valid.reduce((acc, item) => acc + item.weight, 0);
    if (totalWeight === 0) return 0;

    const totalValue = valid.reduce((acc, item) => acc + item.value * item.weight, 0);
    return totalValue / totalWeight;
}

function phaseScore(
    eda: Stats,
    pulse: Stats,
    temperature: Stats
): number {
    const edaScore = normalize(eda.avg, 1.0, 3.2);
    const pulseScore = normalize(pulse.avg, 60, 115);
    const temperatureScore = normalize(temperature.avg, 36.2, 38.5);

    return weightedAverage([
        { value: edaScore, weight: 0.45 },
        { value: pulseScore, weight: 0.4 },
        { value: temperatureScore, weight: 0.15 },
    ]);
}

export function calculateDizziness(session: Session, m: MetricSummary): number {
    const preEvaluation = Number(session.preEvaluation) || 0;
    const postEvaluation = Number(session.postEvaluation) || 0;

    const subjectivePre = normalize(preEvaluation, 0, 10);
    const subjectivePost = normalize(postEvaluation, 0, 10);
    const subjectiveDelta = clamp(((postEvaluation - preEvaluation + 10) / 20) * 100);

    const prePhase = phaseScore(
        m.edaSclUsiemens.pre,
        m.pulseRateBpm.pre,
        m.temperatureCelsius.pre
    );

    const sessionPhase = phaseScore(
        m.edaSclUsiemens.session,
        m.pulseRateBpm.session,
        m.temperatureCelsius.session
    );

    const postPhase = phaseScore(
        m.edaSclUsiemens.post,
        m.pulseRateBpm.post,
        m.temperatureCelsius.post
    );

    const physiologicalBurden = weightedAverage([
        { value: prePhase, weight: 0.3 },
        { value: sessionPhase, weight: 0.45 },
        { value: postPhase, weight: 0.25 },
    ]);

    const recoveryDrop = clamp(prePhase - postPhase, 0, 100);
    const recoveryBonus = recoveryDrop * 0.35;

    const subjectiveBurden = weightedAverage([
        { value: subjectivePre, weight: 0.35 },
        { value: subjectivePost, weight: 0.45 },
        { value: subjectiveDelta, weight: 0.2 },
    ]);

    const rawScore = weightedAverage([
        { value: physiologicalBurden, weight: 0.55 },
        { value: subjectiveBurden, weight: 0.45 },
    ]);

    const finalScore = clamp(rawScore - recoveryBonus, 0, 100);

    return Number(finalScore.toFixed(2));
}