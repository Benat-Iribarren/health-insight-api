export type SessionRow = {
    session_id: number;
    state: string;
    pre_evaluation: number | null;
    post_evaluation: number | null;
    assigned_date?: string;
};

export type ContextIntervalRow = {
    start_minute_utc: string;
    end_minute_utc: string;
    context_type: 'dashboard' | 'session';
    session_id: number | null;
};

export type BiometricMinuteRow = {
    timestamp_iso: string;
    timestamp_unix_ms: number;
    pulse_rate_bpm: number | null;
    eda_scl_usiemens: number | null;
    temperature_celsius: number | null;
    accel_std_g: number | null;
    respiratory_rate_brpm: number | null;
    body_position_type: string | null;
};

export interface SessionMetricsRepository {
    getFullSessionContext(
        patientId: number,
        sessionId?: number,
        limit?: number,
        offset?: number
    ): Promise<{ sessions: SessionRow[]; intervals: ContextIntervalRow[]; total: number }>;

    getBiometricData(startIso: string, endIso: string): Promise<BiometricMinuteRow[]>;
}