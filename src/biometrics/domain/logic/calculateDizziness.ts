import { Session } from '../models/Session';

type Stats = { avg: number; max: number; min: number };

export type MetricSummary = {
    edaSclUsiemens: { pre: Stats; session: Stats; post: Stats };
    pulseRateBpm: { pre: Stats; session: Stats; post: Stats };
    temperatureCelsius: { pre: Stats; session: Stats; post: Stats };
};

export function calculateDizziness(session: Session, m: MetricSummary): number {
    const pre = Number(session.preEvaluation) || 0;
    const post = Number(session.postEvaluation) || 0;

    const sub = Math.min(Math.max(0, (post - pre) / 10), 1) * 100;

    const objScore = (met: { pre: Stats; session: Stats }, w: number, inv = false) => {
        if (!met.pre.avg || !met.session.avg) return 0;
        const diff = inv ? met.pre.avg - met.session.avg : met.session.avg - met.pre.avg;
        return Math.min(Math.max(0, diff / met.pre.avg), 1) * 100 * w;
    };

    const totalObj =
        objScore({ pre: m.edaSclUsiemens.pre, session: m.edaSclUsiemens.session }, 0.4) +
        objScore({ pre: m.pulseRateBpm.pre, session: m.pulseRateBpm.session }, 0.3) +
        objScore({ pre: m.temperatureCelsius.pre, session: m.temperatureCelsius.session }, 0.3, true);

    return Number((sub * 0.4 + totalObj * 0.6).toFixed(2));
}