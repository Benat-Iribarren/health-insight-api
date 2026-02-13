import { SessionMetricsRepository, BiometricMinuteRow, ContextIntervalRow, SessionRow } from '../../domain/interfaces/SessionMetricsRepository';
import { BiometricsError, noDataFoundError, unknownError } from '../types/BiometricsError';

type Stats = { avg: number; max: number; min: number };

type MetricSummary = {
    eda_scl_usiemens: { pre: Stats; session: Stats; post: Stats };
    pulse_rate_bpm: { pre: Stats; session: Stats; post: Stats };
    temperature_celsius: { pre: Stats; session: Stats; post: Stats };
};

export type UnifiedSessionReport = {
    session_id: string;
    state: string;
    dizziness_percentage: number;
    no_biometrics?: true;
    subjective_analysis: { pre_evaluation: number; post_evaluation: number; delta: number };
    objective_analysis: { summary: MetricSummary | Record<string, never>; biometric_details: BiometricMinuteRow[] };
    meta?: { total: number; page: number; limit: number };
};

export class GetUnifiedSessionReportService {
    constructor(private readonly repository: SessionMetricsRepository) {}

    async execute(
        patientId: number,
        sessionId?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ data: UnifiedSessionReport[] | UnifiedSessionReport; meta?: any } | BiometricsError> {
        try {
            const parsedSessionId = sessionId ? Number(sessionId) : undefined;
            const offset = (page - 1) * limit;

            const { sessions, intervals, total } = await this.repository.getFullSessionContext(
                patientId,
                parsedSessionId,
                limit,
                offset
            );

            const now = new Date().getTime();
            const validSessions = sessions.filter((session) => {
                const assignedDate = (session as any).assigned_date;
                const isAssigned = session.state === 'assigned';
                const isFuture = assignedDate ? new Date(assignedDate).getTime() > now : false;

                return !(isAssigned && isFuture);
            });

            if (!validSessions.length) return noDataFoundError;

            if (!intervals.length) {
                const empty = validSessions.map((s) => this.mapEmptyReport(s));
                return parsedSessionId
                    ? { data: empty[0] ?? noDataFoundError }
                    : { data: empty, meta: { total: validSessions.length, page, limit } };
            }

            const { globalStartIso, globalEndIso } = this.getGlobalRange(intervals);
            const biometrics = await this.repository.getBiometricData(globalStartIso, globalEndIso);

            const reports = validSessions
                .map((session) => this.buildReport(session, intervals, biometrics))
                .sort((a, b) => Number(b.session_id) - Number(a.session_id));

            if (parsedSessionId) {
                return reports[0]
                    ? { data: reports[0] }
                    : noDataFoundError;
            }

            return {
                data: reports,
                meta: { total: validSessions.length, page, limit }
            };
        } catch {
            return unknownError;
        }
    }

    private buildReport(session: SessionRow, intervals: ContextIntervalRow[], biometrics: BiometricMinuteRow[]): UnifiedSessionReport {
        const currentId = String(session.id);
        const sIntervals = intervals.filter((i) => String(i.session_id ?? '') === currentId);

        if (!sIntervals.length) return this.mapEmptyReport(session);

        const sessionStart = new Date(sIntervals[0].start_minute_utc).getTime();
        const sessionEnd = new Date(sIntervals[sIntervals.length - 1].end_minute_utc).getTime();

        const preInt = intervals
            .filter((i) => i.context_type === 'dashboard' && new Date(i.end_minute_utc).getTime() <= sessionStart)
            .pop();

        const postInt = intervals.find((i) => i.context_type === 'dashboard' && new Date(i.start_minute_utc).getTime() >= sessionEnd);

        const limitStart = preInt ? new Date(preInt.start_minute_utc).getTime() : sessionStart;
        const limitEnd = postInt ? new Date(postInt.end_minute_utc).getTime() : sessionEnd;

        const sessionData = biometrics.filter((b) => {
            const t = new Date(b.timestamp_iso).getTime();
            return t >= limitStart && t <= limitEnd;
        });

        if (!sessionData.length) return this.mapEmptyReport(session);

        const summary = this.calculateMetrics(
            sessionData,
            preInt?.start_minute_utc,
            preInt?.end_minute_utc,
            postInt?.start_minute_utc,
            postInt?.end_minute_utc,
            sIntervals[0].start_minute_utc,
            sIntervals[sIntervals.length - 1].end_minute_utc
        );

        return {
            session_id: currentId,
            state: session.state,
            dizziness_percentage: this.calculateDizziness(session, summary),
            subjective_analysis: {
                pre_evaluation: Number(session.pre_evaluation) || 0,
                post_evaluation: Number(session.post_evaluation) || 0,
                delta: session.state === 'completed' ? (Number(session.post_evaluation) - Number(session.pre_evaluation)) : 0,
            },
            objective_analysis: { summary, biometric_details: sessionData },
        };
    }

    private getGlobalRange(intervals: ContextIntervalRow[]) {
        const times = intervals.flatMap((i) => [new Date(i.start_minute_utc).getTime(), new Date(i.end_minute_utc).getTime()]);
        return {
            globalStartIso: new Date(Math.min(...times)).toISOString(),
            globalEndIso: new Date(Math.max(...times)).toISOString(),
        };
    }

    private calculateMetrics(
        data: BiometricMinuteRow[],
        preStart?: string,
        preEnd?: string,
        postStart?: string,
        postEnd?: string,
        sessionStart?: string,
        sessionEnd?: string
    ): MetricSummary {
        return {
            eda_scl_usiemens: {
                pre: this.getStats(data, 'eda_scl_usiemens', preStart, preEnd),
                session: this.getStats(data, 'eda_scl_usiemens', sessionStart, sessionEnd),
                post: this.getStats(data, 'eda_scl_usiemens', postStart, postEnd),
            },
            pulse_rate_bpm: {
                pre: this.getStats(data, 'pulse_rate_bpm', preStart, preEnd),
                session: this.getStats(data, 'pulse_rate_bpm', sessionStart, sessionEnd),
                post: this.getStats(data, 'pulse_rate_bpm', postStart, postEnd),
            },
            temperature_celsius: {
                pre: this.getStats(data, 'temperature_celsius', preStart, preEnd),
                session: this.getStats(data, 'temperature_celsius', sessionStart, sessionEnd),
                post: this.getStats(data, 'temperature_celsius', postStart, postEnd),
            },
        };
    }

    private getStats(
        data: BiometricMinuteRow[],
        key: 'eda_scl_usiemens' | 'pulse_rate_bpm' | 'temperature_celsius',
        start?: string,
        end?: string
    ): Stats {
        if (!start || !end) return { avg: 0, max: 0, min: 0 };

        const sTime = new Date(start).getTime();
        const eTime = new Date(end).getTime();

        const vals = data
            .filter((d) => {
                const t = new Date(d.timestamp_iso).getTime();
                return t >= sTime && t <= eTime;
            })
            .map((d) => Number(d[key]))
            .filter((v) => Number.isFinite(v) && v > 0);

        if (!vals.length) return { avg: 0, max: 0, min: 0 };

        const sum = vals.reduce((a, b) => a + b, 0);
        return {
            avg: Number((sum / vals.length).toFixed(2)),
            max: Math.max(...vals),
            min: Math.min(...vals),
        };
    }

    private calculateDizziness(session: SessionRow, m: MetricSummary): number {
        const pre = Number(session.pre_evaluation) || 0;
        const post = Number(session.post_evaluation) || 0;

        const sub = Math.min(Math.max(0, (post - pre) / 10), 1) * 100;

        const objScore = (met: { pre: Stats; session: Stats }, w: number, inv = false) => {
            if (!met.pre.avg || !met.session.avg) return 0;
            const diff = inv ? met.pre.avg - met.session.avg : met.session.avg - met.pre.avg;
            return Math.min(Math.max(0, diff / met.pre.avg), 1) * 100 * w;
        };

        const totalObj =
            objScore({ pre: m.eda_scl_usiemens.pre, session: m.eda_scl_usiemens.session }, 0.4) +
            objScore({ pre: m.pulse_rate_bpm.pre, session: m.pulse_rate_bpm.session }, 0.3) +
            objScore({ pre: m.temperature_celsius.pre, session: m.temperature_celsius.session }, 0.3, true);

        return Number(((sub * 0.4) + (totalObj * 0.6)).toFixed(2));
    }

    private mapEmptyReport(session: SessionRow): UnifiedSessionReport {
        return {
            session_id: String(session.id),
            state: session.state,
            dizziness_percentage: 0,
            no_biometrics: true,
            subjective_analysis: {
                pre_evaluation: Number(session.pre_evaluation) || 0,
                post_evaluation: Number(session.post_evaluation) || 0,
                delta: 0,
            },
            objective_analysis: { summary: {}, biometric_details: [] },
        };
    }
}