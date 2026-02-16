import { parse } from 'csv-parse/sync';
import { BiometricsFileSource } from '../../domain/interfaces/BiometricsFileSource';
import { BiometricMinutesRepository } from '../../domain/interfaces/BiometricMinutesRepository';
import { BiometricsError, invalidInputError, unknownError } from '../types/BiometricsError';

export type SyncResult = {
    status: 'success';
    dateProcessed: string;
    summary: { filesFound: number; rowsInserted: number };
};

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

type UnifiedMinute = {
    timestamp_iso: string;
    pulse_rate_bpm: number | null;
    eda_scl_usiemens: number | null;
    temperature_celsius: number | null;
    accel_std_g: number | null;
    body_position_type: string | null;
    respiratory_rate_brpm: number | null;
};

function toNumberOrNull(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : null;
}

export class SyncDailyBiometricsService {
    constructor(
        private readonly source: BiometricsFileSource,
        private readonly repository: BiometricMinutesRepository
    ) {}

    async execute(date: string): Promise<SyncResult | BiometricsError> {
        try {
            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return invalidInputError;

            const files = await this.source.listDailyFiles(date);
            const dailyFiles = files.filter((f) => f.key.endsWith('.csv'));

            const unifiedData: Record<string, UnifiedMinute> = {};

            for (const file of dailyFiles) {
                const csvContent = await this.source.getFileText(file.key);
                if (!csvContent) continue;

                const fileName = file.key.split('/').pop() ?? '';

                const records = parse(csvContent, { columns: true, skip_empty_lines: true }) as CsvRow[];

                for (const row of records) {
                    if (row.missing_value_reason) continue;

                    const ts = row.timestamp_iso ?? row.timestamp;
                    if (!ts) continue;

                    const unixMs = new Date(ts).getTime();
                    if (Number.isNaN(unixMs)) continue;

                    if (!unifiedData[ts]) {
                        unifiedData[ts] = {
                            timestamp_iso: ts,
                            pulse_rate_bpm: null,
                            eda_scl_usiemens: null,
                            temperature_celsius: null,
                            accel_std_g: null,
                            body_position_type: null,
                            respiratory_rate_brpm: null,
                        };
                    }

                    if (fileName.includes('pulse-rate')) {
                        unifiedData[ts].pulse_rate_bpm = toNumberOrNull(row.pulse_rate_bpm);
                    }

                    if (fileName.includes('eda')) {
                        unifiedData[ts].eda_scl_usiemens = toNumberOrNull(row.eda_scl_usiemens);
                    }

                    if (fileName.includes('temperature')) {
                        unifiedData[ts].temperature_celsius = toNumberOrNull(row.temperature_celsius);
                    }

                    if (fileName.includes('respiratory-rate')) {
                        unifiedData[ts].respiratory_rate_brpm = toNumberOrNull(row.respiratory_rate_brpm);
                    }

                    if (fileName.includes('accelerometers-std')) {
                        unifiedData[ts].accel_std_g = toNumberOrNull(row.accelerometers_std_g);
                    }

                    if (fileName.includes('body-position')) {
                        unifiedData[ts].body_position_type = row.body_position_left ?? row.body_position_right ?? null;
                    }
                }
            }

            const rowsToInsert = Object.values(unifiedData);

            if (rowsToInsert.length > 0) {
                await this.repository.upsertBiometricMinutes(rowsToInsert);
            }

            return {
                status: 'success',
                dateProcessed: date,
                summary: { filesFound: dailyFiles.length, rowsInserted: rowsToInsert.length },
            };
        } catch (err) {
            console.error("SyncDailyBiometricsService error:", err);
            return unknownError;
        }

    }
}
