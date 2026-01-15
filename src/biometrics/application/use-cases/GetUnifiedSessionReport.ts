import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';

export class GetUnifiedSessionReport {
    constructor(private readonly repository: SupabaseSessionMetricsRepository) {}

    async execute(patientId: number, sessionId: string) {
        const { data: session } = await this.repository.getSessionData(patientId, sessionId);
        if (!session) throw new Error('SESSION_NOT_FOUND');

        const { data: intervals } = await this.repository.getContextIntervals(patientId, sessionId);
        const sessionIntervals = intervals?.filter(i => i.session_id === sessionId) || [];
        if (sessionIntervals.length === 0) throw new Error('NO_INTERVALS_FOUND');

        const firstStart = sessionIntervals[0].start_minute_utc;
        const lastEnd = sessionIntervals[sessionIntervals.length - 1].end_minute_utc;

        const preInt = intervals?.filter(i => i.context_type === 'dashboard' && i.end_minute_utc <= firstStart).pop();
        const postInt = intervals?.find(i => i.context_type === 'dashboard' && i.start_minute_utc >= lastEnd);

        const biometrics = await this.repository.getBiometricData(
            patientId,
            preInt?.start_minute_utc || firstStart,
            postInt?.end_minute_utc || lastEnd
        );

        const getStats = (data: any[], key: string, start?: string, end?: string) => {
            if (!start || !end) return { avg: 0, max: 0, min: 0 };
            const filtered = data.filter(b => b.timestamp_iso >= start && b.timestamp_iso <= end);
            const values = filtered.map(d => d[key]).filter(v => v !== null) as number[];
            if (values.length === 0) return { avg: 0, max: 0, min: 0 };
            return {
                avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
                max: Math.max(...values),
                min: Math.min(...values)
            };
        };

        const metrics: any = {};
        const keys = ['eda_scl_usiemens', 'prv_rmssd_ms', 'pulse_rate_bpm', 'temperature_celsius', 'spo2_percentage'];

        keys.forEach(k => {
            metrics[k] = {
                pre: getStats(biometrics.data || [], k, preInt?.start_minute_utc, preInt?.end_minute_utc),
                session: getStats(biometrics.data || [], k, firstStart, lastEnd),
                post: getStats(biometrics.data || [], k, postInt?.start_minute_utc, postInt?.end_minute_utc)
            };
        });

        const subjectiveScore = ((session.post_evaluation || 0) - (session.pre_evaluation || 0)) * 10 * 0.4;

        const calcObj = (m: any, w: number, inv = false) => {
            if (m.pre.avg === 0) return 0;
            const dSes = inv ? (m.pre.avg - m.session.avg) / m.pre.avg : (m.session.avg - m.pre.avg) / m.pre.avg;
            const dPost = inv ? (m.pre.avg - m.post.avg) / m.pre.avg : (m.post.avg - m.pre.avg) / m.pre.avg;
            return Math.min(Math.max(0, dSes * 0.7 + dPost * 0.3) * 100, 100) * w;
        };

        const objectiveScore =
            calcObj(metrics.eda_scl_usiemens, 0.20) + calcObj(metrics.prv_rmssd_ms, 0.15, true) +
            calcObj(metrics.pulse_rate_bpm, 0.10) + calcObj(metrics.temperature_celsius, 0.10) +
            calcObj(metrics.spo2_percentage, 0.05, true);

        return {
            state: session.state,
            attempts: sessionIntervals.length,
            total_duration_minutes: Math.round((new Date(lastEnd).getTime() - new Date(firstStart).getTime()) / 60000),
            final_score_percentage: parseFloat((subjectiveScore + objectiveScore).toFixed(2)),
            phases_detected: {
                pre: { start: preInt?.start_minute_utc || null, end: preInt?.end_minute_utc || null },
                session: { start: firstStart, end: lastEnd },
                post: { start: postInt?.start_minute_utc || null, end: postInt?.end_minute_utc || null }
            },
            subjective_analysis: {
                pre_evaluation: session.pre_evaluation,
                post_evaluation: session.post_evaluation,
                delta: (session.post_evaluation || 0) - (session.pre_evaluation || 0)
            },
            objective_metrics: metrics
        };
    }
}