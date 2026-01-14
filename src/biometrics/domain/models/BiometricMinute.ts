export interface BiometricMinute {
    participant_full_id: string;
    device_sn: string | null;
    timestamp_unix_ms: number;
    timestamp_iso: string;
    pulse_rate_bpm: number | null;
    prv_rmssd_ms: number | null;
    respiratory_rate_brpm: number | null;
    eda_scl_usiemens: number | null;
    temperature_celsius: number | null;
    patient_id: string;
}