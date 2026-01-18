import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';
import { Tables } from '@common/infrastructure/database/supabaseTypes';

type BiometricRow = Pick<Tables<'BiometricMinutes'>, 'timestamp_iso' | 'eda_scl_usiemens' | 'pulse_rate_bpm' | 'temperature_celsius' | 'accel_std_g' | 'respiratory_rate_brpm'>;

export class GetUnifiedSessionReport {
    constructor(private readonly repository: SupabaseSessionMetricsRepository) {}

    async execute(userId: string, patientId: number, sessionId: string) {
        const { session, intervals } = await this.repository.getFullSessionContext(userId, patientId, sessionId);
        if (!session || !intervals) throw new Error('SESSION_OR_INTERVALS_NOT_FOUND');

        const sessionIntervals = intervals.filter(i => i.session_id === sessionId);
        if (sessionIntervals.length === 0) throw new Error('NO_INTERVALS_FOUND');

        const firstStart = sessionIntervals[0].start_minute_utc;
        const lastEnd = sessionIntervals[sessionIntervals.length - 1].end_minute_utc;

        const preInt = intervals.filter(i => i.context_type === 'dashboard' && i.end_minute_utc <= firstStart).pop();
        const postInt = intervals.find(i => i.context_type === 'dashboard' && i.start_minute_utc >= lastEnd);

        const { data: biometrics } = await this.repository.getBiometricData(
            preInt?.start_minute_utc || firstStart,
            postInt?.end_minute_utc || lastEnd
        );

        const metricKeys = ['eda_scl_usiemens', 'pulse_rate_bpm', 'temperature_celsius', 'accel_std_g', 'respiratory_rate_brpm'] as const;
        type MetricKey = typeof metricKeys[number];

        const statsTemplate = () => ({ sum: 0, count: 0, max: -Infinity, min: Infinity });
        const results: Record<MetricKey, Record<string, ReturnType<typeof statsTemplate>>> = {
            eda_scl_usiemens: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() },
            pulse_rate_bpm: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() },
            temperature_celsius: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() },
            accel_std_g: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() },
            respiratory_rate_brpm: { pre: statsTemplate(), session: statsTemplate(), post: statsTemplate() }
        };

        biometrics?.forEach((row) => {
            let phase = '';
            if (preInt && row.timestamp_iso >= preInt.start_minute_utc && row.timestamp_iso <= preInt.end_minute_utc) phase = 'pre';
            else if (row.timestamp_iso >= firstStart && row.timestamp_iso <= lastEnd) phase = 'session';
            else if (postInt && row.timestamp_iso >= postInt.start_minute_utc && row.timestamp_iso <= postInt.end_minute_utc) phase = 'post';

            if (phase) {
                metricKeys.forEach((key) => {
                    const val = row[key as keyof BiometricRow];
                    if (val !== null && val !== undefined) {
                        const s = results[key][phase];
                        const numVal = Number(val);
                        s.sum += numVal;
                        s.count++;
                        if (numVal > s.max) s.max = numVal;
                        if (numVal < s.min) s.min = numVal;
                    }
                });
            }
        });

        const finalMetrics = metricKeys.reduce((acc: any, key) => {
            acc[key] = Object.keys(results[key]).reduce((pAcc: any, phase) => {
                const s = results[key][phase as keyof typeof results[MetricKey]];
                pAcc[phase] = {
                    avg: s.count ? parseFloat((s.sum / s.count).toFixed(2)) : 0,
                    max: s.max === -Infinity ? 0 : s.max,
                    min: s.min === Infinity ? 0 : s.min
                };
                return pAcc;
            }, {});
            return acc;
        }, {});

        const preEval = session.pre_evaluation || 0;
        const postEval = session.post_evaluation || 0;
        const subjectiveImpact = Math.min(Math.max(0, (postEval - preEval) / 10), 1) * 100;

        const calcObj = (m: any, w: number, inv = false) => {
            if (!m.pre.avg || !m.session.avg) return 0;
            const ratio = inv ? (m.pre.avg - m.session.avg) / m.pre.avg : (m.session.avg - m.pre.avg) / m.pre.avg;
            return Math.min(Math.max(0, ratio), 1) * 100 * w;
        };

        const objectiveScore =
            calcObj(finalMetrics.eda_scl_usiemens, 0.4) +
            calcObj(finalMetrics.pulse_rate_bpm, 0.3) +
            calcObj(finalMetrics.temperature_celsius, 0.3, true);

        return {
            session_id: sessionId,
            final_score_percentage: parseFloat(((subjectiveImpact * 0.4) + (objectiveScore * 0.6)).toFixed(2)),
            subjective_analysis: { pre_evaluation: preEval, post_evaluation: postEval, delta: postEval - preEval },
            objective_analysis: { metrics: finalMetrics },
            duration_minutes: Math.round((new Date(lastEnd).getTime() - new Date(firstStart).getTime()) / 60000)
        };
    }
}