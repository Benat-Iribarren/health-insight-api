import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';

export class GetUnifiedSessionReport {
    constructor(private readonly repository: SupabaseSessionMetricsRepository) {}

    async execute(patientId: number, sessionId?: string) {
        const { sessions, intervals } = await this.repository.getFullSessionContext(patientId, sessionId);
        if (sessions.length === 0) throw new Error('SESSION_NOT_FOUND');

        const weekly_summary = this.calculateWeeklySummary(sessions);
        const allBiometrics = await this.fetchGlobalBiometrics(intervals);

        const reports = sessions
            .map(session => this.processSession(session, intervals, allBiometrics, sessionId))
            .filter(r => r !== null)
            .sort((a, b) => Number(b.session_id) - Number(a.session_id));

        return {
            weekly_summary,
            reports: sessionId ? (reports[0] || null) : reports
        };
    }

    private calculateWeeklySummary(sessions: any[]) {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        return {
            completed: sessions.filter(s => s.state === 'completed').length,
            in_progress: sessions.filter(s => s.state === 'in_progress').length,
            pending: sessions.filter(s => {
                const d = new Date(s.assigned_date);
                return (s.state === 'assigned' || s.state === 'not_started') && d >= startOfWeek;
            }).length
        };
    }

    private async fetchGlobalBiometrics(intervals: any[]) {
        if (intervals.length === 0) return [];
        const start = intervals[0].start_minute_utc;
        const end = intervals[intervals.length - 1].end_minute_utc;
        const { data } = await this.repository.getBiometricData(start, end);
        return data || [];
    }

    private processSession(session: any, allIntervals: any[], biometrics: any[], filterSessionId?: string) {
        const currentId = session.id.toString();
        if (filterSessionId && currentId !== filterSessionId) return null;

        const sIntervals = allIntervals.filter(i =>
            i.session_id?.endsWith(currentId.padStart(12, '0')) || i.session_id?.includes(currentId)
        );

        if (sIntervals.length === 0) return this.mapEmptyReport(session);

        const firstStart = sIntervals[0].start_minute_utc;
        const lastEnd = sIntervals[sIntervals.length - 1].end_minute_utc;

        const preInt = allIntervals.filter(i => i.context_type === 'dashboard' && i.end_minute_utc <= firstStart).pop();
        const postInt = allIntervals.find(i => i.context_type === 'dashboard' && i.start_minute_utc >= lastEnd);

        const sessionBiometrics = biometrics.filter(d =>
            d.timestamp_iso >= (preInt?.start_minute_utc || firstStart) &&
            d.timestamp_iso <= (postInt?.end_minute_utc || lastEnd)
        );

        const metricsSummary = this.calculateMetrics(biometrics, preInt, postInt, firstStart, lastEnd);
        const dizziness_percentage = this.calculateDizziness(session, metricsSummary);

        return {
            session_id: currentId,
            state: session.state,
            dizziness_percentage,
            subjective_analysis: {
                pre_evaluation: session.pre_evaluation || 0,
                post_evaluation: session.post_evaluation || 0,
                delta: (session.post_evaluation || 0) - (session.pre_evaluation || 0)
            },
            objective_analysis: {
                summary: metricsSummary,
                biometric_details: sessionBiometrics
            }
        };
    }

    private calculateMetrics(biometrics: any[], pre: any, post: any, start: string, end: string) {
        const keys = ['eda_scl_usiemens', 'pulse_rate_bpm', 'temperature_celsius'] as const;
        const stats: any = {};
        keys.forEach(key => {
            stats[key] = {
                pre: this.getPhaseStats(biometrics, key, pre?.start_minute_utc, pre?.end_minute_utc),
                session: this.getPhaseStats(biometrics, key, start, end),
                post: this.getPhaseStats(biometrics, key, post?.start_minute_utc, post?.end_minute_utc)
            };
        });
        return stats;
    }

    private getPhaseStats(data: any[], key: string, start?: string, end?: string) {
        if (!start || !end) return { avg: 0, max: 0, min: 0 };
        const values = data
            .filter(d => d.timestamp_iso >= start && d.timestamp_iso <= end)
            .map(d => Number(d[key]))
            .filter(v => !isNaN(v) && v !== 0);

        if (values.length === 0) return { avg: 0, max: 0, min: 0 };
        return {
            avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
            max: Math.max(...values),
            min: Math.min(...values)
        };
    }

    private calculateDizziness(session: any, metrics: any) {
        const subjectiveScore = Math.min(Math.max(0, ((session.post_evaluation || 0) - (session.pre_evaluation || 0)) / 10), 1) * 100;
        const calcObj = (m: any, weight: number, inverse = false) => {
            if (!m.pre.avg || !m.session.avg) return 0;
            const diff = inverse ? (m.pre.avg - m.session.avg) : (m.session.avg - m.pre.avg);
            const ratio = diff / m.pre.avg;
            return Math.min(Math.max(0, ratio), 1) * 100 * weight;
        };
        const objectiveScore = calcObj(metrics.eda_scl_usiemens, 0.4) + calcObj(metrics.pulse_rate_bpm, 0.3) + calcObj(metrics.temperature_celsius, 0.3, true);
        return parseFloat(((subjectiveScore * 0.4) + (objectiveScore * 0.6)).toFixed(2));
    }

    private mapEmptyReport(session: any) {
        return {
            session_id: session.id.toString(),
            state: session.state,
            dizziness_percentage: 0,
            no_biometrics: true,
            subjective_analysis: {
                pre_evaluation: session.pre_evaluation || 0,
                post_evaluation: session.post_evaluation || 0,
                delta: (session.post_evaluation || 0) - (session.pre_evaluation || 0)
            },
            objective_analysis: { summary: {}, biometric_details: [] }
        };
    }
}