import { GetUnifiedSessionReportService } from '../GetUnifiedSessionReportService';
import { SessionMetricsRepository } from '../../../domain/interfaces/SessionMetricsRepository';

describe('Unit | GetUnifiedSessionReportService', () => {
    it('returns NO_DATA_FOUND when no sessions', async () => {
        const repo: SessionMetricsRepository = {
            getFullSessionContext: async () => ({ sessions: [], intervals: [] }),
            getBiometricData: async () => [],
        };

        const uc = new GetUnifiedSessionReportService(repo);
        const result = await uc.execute(1);

        expect(result).toBe('NO_DATA_FOUND');
    });

    it('returns empty reports when no intervals', async () => {
        const repo: SessionMetricsRepository = {
            getFullSessionContext: async () => ({
                sessions: [{ id: 10, state: 'completed', pre_evaluation: 2, post_evaluation: 5 }],
                intervals: [],
            }),
            getBiometricData: async () => [],
        };

        const uc = new GetUnifiedSessionReportService(repo);
        const result = await uc.execute(1);

        expect(Array.isArray(result)).toBe(true);
        const arr = result as any[];
        expect(arr[0]).toMatchObject({
            session_id: '10',
            state: 'completed',
            no_biometrics: true,
            dizziness_percentage: 0,
        });
    });

    it('computes summary and dizziness when biometrics exist', async () => {
        const now = new Date();
        now.setUTCSeconds(0, 0);

        const preStart = new Date(now.getTime() - 30 * 60_000);
        const preEnd = new Date(preStart.getTime() + 10 * 60_000);
        const sesStart = new Date(preEnd.getTime());
        const sesEnd = new Date(sesStart.getTime() + 10 * 60_000);
        const postStart = new Date(sesEnd.getTime());
        const postEnd = new Date(postStart.getTime() + 10 * 60_000);

        const repo: SessionMetricsRepository = {
            getFullSessionContext: async () => ({
                sessions: [{ id: 10, state: 'completed', pre_evaluation: 2, post_evaluation: 5 }],
                intervals: [
                    { context_type: 'dashboard', session_id: null, start_minute_utc: preStart.toISOString(), end_minute_utc: preEnd.toISOString() },
                    { context_type: 'session', session_id: 10, start_minute_utc: sesStart.toISOString(), end_minute_utc: sesEnd.toISOString() },
                    { context_type: 'dashboard', session_id: null, start_minute_utc: postStart.toISOString(), end_minute_utc: postEnd.toISOString() },
                ],
            }),
            getBiometricData: async () => [
                { timestamp_iso: new Date(preStart.getTime() + 60_000).toISOString(), timestamp_unix_ms: preStart.getTime() + 60_000, pulse_rate_bpm: 60, eda_scl_usiemens: 1.0, temperature_celsius: 36.8, accel_std_g: 0.01, respiratory_rate_brpm: 14, body_position_type: 'left' },
                { timestamp_iso: new Date(sesStart.getTime() + 60_000).toISOString(), timestamp_unix_ms: sesStart.getTime() + 60_000, pulse_rate_bpm: 90, eda_scl_usiemens: 2.0, temperature_celsius: 36.4, accel_std_g: 0.05, respiratory_rate_brpm: 18, body_position_type: 'left' },
                { timestamp_iso: new Date(postStart.getTime() + 60_000).toISOString(), timestamp_unix_ms: postStart.getTime() + 60_000, pulse_rate_bpm: 65, eda_scl_usiemens: 1.1, temperature_celsius: 36.7, accel_std_g: 0.01, respiratory_rate_brpm: 12, body_position_type: 'right' },
            ],
        };

        const uc = new GetUnifiedSessionReportService(repo);
        const result = await uc.execute(1);

        expect(Array.isArray(result)).toBe(true);
        const report = (result as any[])[0];

        expect(report.session_id).toBe('10');
        expect(report.objective_analysis.summary.eda_scl_usiemens.pre).toEqual({ avg: 1, max: 1, min: 1 });
        expect(report.objective_analysis.summary.eda_scl_usiemens.session).toEqual({ avg: 2, max: 2, min: 2 });
        expect(report.objective_analysis.summary.pulse_rate_bpm.pre).toEqual({ avg: 60, max: 60, min: 60 });
        expect(report.objective_analysis.summary.pulse_rate_bpm.session).toEqual({ avg: 90, max: 90, min: 90 });

        expect(report.subjective_analysis).toEqual({ pre_evaluation: 2, post_evaluation: 5, delta: 3 });
        expect(report.dizziness_percentage).toBeCloseTo(45.2, 1);
    });
});
