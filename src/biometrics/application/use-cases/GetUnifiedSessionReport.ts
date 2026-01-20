import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';

export class GetUnifiedSessionReport {
    constructor(private readonly repository: SupabaseSessionMetricsRepository) {}

    async execute(patientId: number, sessionId?: string) {
        const { sessions, intervals } = await this.repository.getFullSessionContext(patientId, sessionId);

        if (!sessions || sessions.length === 0) throw new Error('SESSION_NOT_FOUND');
        if (!intervals || intervals.length === 0) return sessions.map(s => this.mapEmptyReport(s));

        // 1. Definimos la ventana temporal total de todos los intervalos
        const allTimes = intervals.flatMap(i => [
            new Date(i.start_minute_utc).getTime(),
            new Date(i.end_minute_utc).getTime()
        ]);
        const globalStart = new Date(Math.min(...allTimes)).toISOString();
        const globalEnd = new Date(Math.max(...allTimes)).toISOString();

        // 2. Traemos toda la biometría global del periodo
        const { data: biometrics } = await this.repository.getBiometricData(globalStart, globalEnd);
        const biometricList = biometrics || [];

        // 3. Mapeamos cada sesión a sus datos
        const reports = sessions
            .map(session => {
                const currentId = session.id.toString();
                const sessionIntervals = intervals.filter(i => i.session_id?.toString() === currentId);

                if (sessionIntervals.length === 0) return this.mapEmptyReport(session);

                // Tiempos clave de la sesión (fase session)
                const startStr = sessionIntervals[0].start_minute_utc;
                const endStr = sessionIntervals[sessionIntervals.length - 1].end_minute_utc;
                const startTime = new Date(startStr).getTime();
                const endTime = new Date(endStr).getTime();

                // Identificamos dashboard pre y post (búsqueda temporal)
                const preInt = intervals.filter(i =>
                    i.context_type === 'dashboard' &&
                    new Date(i.end_minute_utc).getTime() <= startTime
                ).pop();

                const postInt = intervals.find(i =>
                    i.context_type === 'dashboard' &&
                    new Date(i.start_minute_utc).getTime() >= endTime
                );

                // FILTRO ROBUSTO: Unimos biometría por milisegundos
                const sessionData = biometricList.filter(b => {
                    const bTime = new Date(b.timestamp_iso).getTime();
                    const limitStart = preInt ? new Date(preInt.start_minute_utc).getTime() : startTime;
                    const limitEnd = postInt ? new Date(postInt.end_minute_utc).getTime() : endTime;
                    return bTime >= limitStart && bTime <= limitEnd;
                });

                if (sessionData.length === 0) return this.mapEmptyReport(session);

                const metricsSummary = this.calculateMetrics(sessionData, preInt, postInt, startStr, endStr);
                const dizziness = this.calculateDizziness(session, metricsSummary);

                return {
                    session_id: currentId,
                    state: session.state,
                    dizziness_percentage: dizziness,
                    subjective_analysis: {
                        pre_evaluation: Number(session.pre_evaluation) || 0,
                        post_evaluation: Number(session.post_evaluation) || 0,
                        delta: session.state === 'completed' ? (Number(session.post_evaluation) - Number(session.pre_evaluation)) : 0
                    },
                    objective_analysis: {
                        summary: metricsSummary,
                        biometric_details: sessionData
                    }
                };
            })
            .sort((a, b) => Number(b.session_id) - Number(a.session_id));

        return sessionId ? (reports[0] || null) : reports;
    }

    private calculateMetrics(data: any[], pre: any, post: any, start: string, end: string) {
        const keys = ['eda_scl_usiemens', 'pulse_rate_bpm', 'temperature_celsius'] as const;
        const result: any = {};
        keys.forEach(key => {
            result[key] = {
                pre: this.getStats(data, key, pre?.start_minute_utc, pre?.end_minute_utc),
                session: this.getStats(data, key, start, end),
                post: this.getStats(data, key, post?.start_minute_utc, post?.end_minute_utc)
            };
        });
        return result;
    }

    private getStats(data: any[], key: string, start?: string, end?: string) {
        if (!start || !end) return { avg: 0, max: 0, min: 0 };
        const sTime = new Date(start).getTime();
        const eTime = new Date(end).getTime();

        const values = data
            .filter(d => {
                const t = new Date(d.timestamp_iso).getTime();
                return t >= sTime && t <= eTime;
            })
            .map(d => Number(d[key]))
            .filter(v => !isNaN(v) && v > 0);

        if (values.length === 0) return { avg: 0, max: 0, min: 0 };
        return {
            avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
            max: Math.max(...values),
            min: Math.min(...values)
        };
    }

    private calculateDizziness(session: any, metrics: any) {
        const pre = Number(session.pre_evaluation) || 0;
        const post = Number(session.post_evaluation) || 0;
        const subScore = Math.min(Math.max(0, (post - pre) / 10), 1) * 100;

        const getObjScore = (m: any, weight: number, inv = false) => {
            if (!m.pre.avg || !m.session.avg) return 0;
            const diff = inv ? (m.pre.avg - m.session.avg) : (m.session.avg - m.pre.avg);
            return Math.min(Math.max(0, diff / m.pre.avg), 1) * 100 * weight;
        };

        const objScore =
            getObjScore(metrics.eda_scl_usiemens, 0.4) +
            getObjScore(metrics.pulse_rate_bpm, 0.3) +
            getObjScore(metrics.temperature_celsius, 0.3, true);

        return parseFloat(((subScore * 0.4) + (objScore * 0.6)).toFixed(2));
    }

    private mapEmptyReport(session: any) {
        return {
            session_id: session.id.toString(),
            state: session.state,
            dizziness_percentage: 0,
            no_biometrics: true,
            subjective_analysis: {
                pre_evaluation: Number(session.pre_evaluation) || 0,
                post_evaluation: Number(session.post_evaluation) || 0,
                delta: 0
            },
            objective_analysis: { summary: {}, biometric_details: [] }
        };
    }
}