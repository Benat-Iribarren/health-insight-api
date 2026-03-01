import { BiometricSample } from '../models/BiometricSample';

type CsvRow = {
    missing_value_reason?: string;
    timestamp_iso?: string;
    timestamp?: string;
    pulse_rate_bpm?: string;
    eda_scl_usiemens?: string;
    temperature_celsius?: string;
    respiratory_rate_brpm?: string;
    accelerometers_std_g?: string;
    body_position_left?: string;
    body_position_right?: string;
};

function toNumberOrNull(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : null;
}

function getOrCreate(map: Map<number, BiometricSample>, ts: Date): BiometricSample {
    const key = ts.getTime();
    const existing = map.get(key);
    if (existing) return existing;

    const created: BiometricSample = {
        timestamp: ts,
        pulseRateBpm: null,
        edaSclUsiemens: null,
        temperatureCelsius: null,
        accelStdG: null,
        bodyPositionType: null,
        respiratoryRateBrpm: null,
    };

    map.set(key, created);
    return created;
}

export function unifyDailyBiometricsFromCsvFiles(files: Array<{ key: string; rows: CsvRow[] }>): BiometricSample[] {
    const map = new Map<number, BiometricSample>();

    for (const file of files) {
        const fileName = file.key.split('/').pop() ?? '';

        for (const row of file.rows) {
            if (row.missing_value_reason) continue;

            const tsRaw = row.timestamp_iso ?? row.timestamp;
            if (!tsRaw) continue;

            const ts = new Date(tsRaw);
            if (Number.isNaN(ts.getTime())) continue;

            const m = getOrCreate(map, ts);

            if (fileName.includes('pulse-rate')) m.pulseRateBpm = toNumberOrNull(row.pulse_rate_bpm);
            if (fileName.includes('eda')) m.edaSclUsiemens = toNumberOrNull(row.eda_scl_usiemens);
            if (fileName.includes('temperature')) m.temperatureCelsius = toNumberOrNull(row.temperature_celsius);
            if (fileName.includes('respiratory-rate')) m.respiratoryRateBrpm = toNumberOrNull(row.respiratory_rate_brpm);
            if (fileName.includes('accelerometers-std')) m.accelStdG = toNumberOrNull(row.accelerometers_std_g);
            if (fileName.includes('body-position')) m.bodyPositionType = row.body_position_left ?? row.body_position_right ?? null;
        }
    }

    return Array.from(map.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}