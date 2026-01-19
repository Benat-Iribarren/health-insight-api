import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';

export class GetUnifiedSessionReport {
    constructor(private readonly repository: SupabaseSessionMetricsRepository) {}

    async execute(patientId: number, sessionId?: string) {
        const { sessions, intervals } = await this.repository.getFullSessionContext(patientId, sessionId);

        if (sessions.length === 0) throw new Error('SESSION_NOT_FOUND');

        const reports = await Promise.all(sessions.map(async (session) => {
            const currentIdNum = session.id.toString();

            const sIntervals = intervals.filter(i => {
                if (!i.session_id) return false;
                const sidStr = i.session_id.toString();
                return sidStr.endsWith(currentIdNum.padStart(12, '0'));
            });

            if (sIntervals.length === 0) return null;

            const firstStart = sIntervals[0].start_minute_utc;
            const lastEnd = sIntervals[sIntervals.length - 1].end_minute_utc;

            const preInt = intervals.filter(i => i.context_type === 'dashboard' && i.end_minute_utc <= firstStart).pop();
            const postInt = intervals.find(i => i.context_type === 'dashboard' && i.start_minute_utc >= lastEnd);

            const { data: biometrics } = await this.repository.getBiometricData(
                preInt?.start_minute_utc || firstStart,
                postInt?.end_minute_utc || lastEnd
            );

            const metricKeys = ['eda_scl_usiemens', 'pulse_rate_bpm', 'temperature_celsius'] as const;
            const statsTemplate = () => ({ sum: 0, count: 0, max: -Infinity, min: Infinity });
            const results: any = {
                eda_scl_usiemens: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() },
                pulse_rate_bpm: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() },
                temperature_celsius: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() }
            };

            biometrics?.forEach((row: any) => {
                let phase = '';
                if (preInt && row.timestamp_iso >= preInt.start_minute_utc && row.timestamp_iso <= preInt.end_minute_utc) phase = 'pre';
                else if (row.timestamp_iso >= firstStart && row.timestamp_iso <= lastEnd) phase = 'session';
                else if (postInt && row.timestamp_iso >= postInt.start_minute_utc && row.timestamp_iso <= postInt.end_minute_utc) phase = 'post';

                if (phase) {
                    metricKeys.forEach(key => {
                        const val = Number(row[key]);
                        if (!isNaN(val) && val !== 0) {
                            const s = results[key][phase];
                            s.sum += val; s.count++;
                            if (val > s.max) s.max = val;
                            if (val < s.min) s.min = val;
                        }
                    });
                }
            });

            const finalMetrics = metricKeys.reduce((acc: any, key) => {
                acc[key] = Object.keys(results[key]).reduce((pAcc: any, phase) => {
                    const s = results[key][phase];
                    pAcc[phase] = {
                        avg: s.count ? parseFloat((s.sum / s.count).toFixed(2)) : 0,
                        max: s.max === -Infinity ? 0 : s.max,
                        min: s.min === Infinity ? 0 : s.min
                    };
                    return pAcc;
                }, {});
                return acc;
            }, {});

            const subjectiveImpact = Math.min(Math.max(0, ((session.post_evaluation || 0) - (session.pre_evaluation || 0)) / 10), 1) * 100;

            const calcObj = (m: any, w: number, inv = false) => {
                if (!m.pre.avg || !m.session.avg) return 0;
                const ratio = inv ? (m.pre.avg - m.session.avg) / m.pre.avg : (m.session.avg - m.pre.avg) / m.pre.avg;
                return Math.min(Math.max(0, ratio), 1) * 100 * w;
            };

            const objectiveScore = calcObj(finalMetrics.eda_scl_usiemens, 0.4) +
                calcObj(finalMetrics.pulse_rate_bpm, 0.3) +
                calcObj(finalMetrics.temperature_celsius, 0.3, true);

            return {
                session_id: currentIdNum,
                final_score_percentage: parseFloat(((subjectiveImpact * 0.4) + (objectiveScore * 0.6)).toFixed(2)),
                subjective_analysis: {
                    pre_evaluation: session.pre_evaluation || 0,
                    post_evaluation: session.post_evaluation || 0,
                    delta: (session.post_evaluation || 0) - (session.pre_evaluation || 0)
                },
                objective_analysis: { metrics: finalMetrics }
            };
        }));

        const validReports = reports.filter(r => r !== null);
        return sessionId ? (validReports[0] || null) : validReports;
    }
}