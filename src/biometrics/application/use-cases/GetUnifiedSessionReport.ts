import { SupabaseSessionMetricsRepository } from '../../infrastructure/database/SupabaseSessionMetricsRepository';

export class GetUnifiedSessionReport {
    constructor(private readonly repository: SupabaseSessionMetricsRepository) {}

    async execute(patientId: number, sessionId?: string) {
        const { sessions, intervals } = await this.repository.getFullSessionContext(patientId, sessionId);

        if (!sessions.length) throw new Error('SESSION_NOT_FOUND');
        if (!intervals.length) return sessions.map(s => this.mapEmptyReport(s));

        // 1. Rango global de tiempo para la consulta
        const times = intervals.flatMap(i => [
            new Date(i.start_minute_utc).getTime(),
            new Date(i.end_minute_utc).getTime()
        ]);
        const globalStart = new Date(Math.min(...times)).toISOString();
        const globalEnd = new Date(Math.max(...times)).toISOString();

        // 2. Obtener biometría
        const { data: biometrics } = await this.repository.getBiometricData(globalStart, globalEnd);
        const biometricList = biometrics || [];

        // LOG CRÍTICO: Ver en Render si llegan datos de la DB
        console.error(`CHECK: Biometría en DB = ${biometricList.length} filas`);

        const reports = sessions.map(session => {
            const currentId = session.id.toString();

            // Filtrar intervalos de esta sesión
            const sIntervals = intervals.filter(i => i.session_id?.toString() === currentId);

            console.error(`CHECK: Sesión ${currentId} tiene ${sIntervals.length} intervalos`);

            if (!sIntervals.length) return this.mapEmptyReport(session);

            const sessionStart = new Date(sIntervals[0].start_minute_utc).getTime();
            const sessionEnd = new Date(sIntervals[sIntervals.length - 1].end_minute_utc).getTime();

            // Dashboards
            const preInt = intervals.filter(i => i.context_type === 'dashboard' && new Date(i.end_minute_utc).getTime() <= sessionStart).pop();
            const postInt = intervals.find(i => i.context_type === 'dashboard' && new Date(i.start_minute_utc).getTime() >= sessionEnd);

            // 3. Unión temporal definitiva (Uso de milisegundos)
            const sessionData = biometricList.filter(b => {
                const bTime = new Date(b.timestamp_iso).getTime();
                const limitStart = preInt ? new Date(preInt.start_minute_utc).getTime() : sessionStart;
                const limitEnd = postInt ? new Date(postInt.end_minute_utc).getTime() : sessionEnd;
                return bTime >= limitStart && bTime <= limitEnd;
            });

            console.error(`CHECK: Sesión ${currentId} -> Biometría filtrada final = ${sessionData.length}`);

            if (!sessionData.length) return this.mapEmptyReport(session);

            const summary = this.calculateMetrics(sessionData, preInt, postInt, sIntervals[0].start_minute_utc, sIntervals[sIntervals.length - 1].end_minute_utc);

            return {
                session_id: currentId,
                state: session.state,
                dizziness_percentage: this.calculateDizziness(session, summary),
                subjective_analysis: {
                    pre_evaluation: Number(session.pre_evaluation) || 0,
                    post_evaluation: Number(session.post_evaluation) || 0,
                    delta: session.state === 'completed' ? (Number(session.post_evaluation) - Number(session.pre_evaluation)) : 0
                },
                objective_analysis: { summary, biometric_details: sessionData }
            };
        }).sort((a, b) => Number(b.session_id) - Number(a.session_id));

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

        const vals = data
            .filter(d => {
                const t = new Date(d.timestamp_iso).getTime();
                return t >= sTime && t <= eTime;
            })
            .map(d => Number(d[key]))
            .filter(v => !isNaN(v) && v > 0);

        if (!vals.length) return { avg: 0, max: 0, min: 0 };
        return {
            avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
            max: Math.max(...vals),
            min: Math.min(...vals)
        };
    }

    private calculateDizziness(session: any, m: any) {
        const sub = Math.min(Math.max(0, (Number(session.post_evaluation) - Number(session.pre_evaluation)) / 10), 1) * 100;
        const objScore = (met: any, w: number, inv = false) => {
            if (!met.pre.avg || !met.session.avg) return 0;
            const diff = inv ? (met.pre.avg - met.session.avg) : (met.session.avg - met.pre.avg);
            return Math.min(Math.max(0, diff / met.pre.avg), 1) * 100 * w;
        };
        const totalObj = objScore(m.eda_scl_usiemens, 0.4) + objScore(m.pulse_rate_bpm, 0.3) + objScore(m.temperature_celsius, 0.3, true);
        return parseFloat(((sub * 0.4) + (totalObj * 0.6)).toFixed(2));
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
