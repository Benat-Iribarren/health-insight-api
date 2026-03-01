import { parse } from 'csv-parse/sync';
import { BiometricsFileSource } from '../../domain/interfaces/BiometricsFileSource';
import { BiometricMinutesRepository } from '../../domain/interfaces/BiometricMinutesRepository';
import { BiometricsError, invalidInputError, unknownError } from '../types/BiometricsError';
import { validateSyncDate } from '../../domain/validation/validateSyncDate';
import { unifyDailyBiometricsFromCsvFiles } from '../../domain/logic/unifyDailyBiometricMinutes';

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

export class SyncDailyBiometricsService {
    constructor(
        private readonly source: BiometricsFileSource,
        private readonly repository: BiometricMinutesRepository
    ) {}

    async execute(date: string): Promise<SyncResult | BiometricsError> {
        try {
            const validation = validateSyncDate(date);
            if (!validation.ok) return invalidInputError;

            const files = await this.source.listDailyFiles(validation.value);
            const dailyFiles = files.filter((f) => f.key.endsWith('.csv'));

            const parsedFiles: Array<{ key: string; rows: CsvRow[] }> = [];

            for (const file of dailyFiles) {
                const csvContent = await this.source.getFileText(file.key);
                if (!csvContent) continue;

                const rows = parse(csvContent, { columns: true, skip_empty_lines: true }) as CsvRow[];
                parsedFiles.push({ key: file.key, rows });
            }

            const samples = unifyDailyBiometricsFromCsvFiles(parsedFiles);

            if (samples.length > 0) {
                await this.repository.upsertBiometricMinutes(samples);
            }

            return {
                status: 'success',
                dateProcessed: validation.value,
                summary: { filesFound: dailyFiles.length, rowsInserted: samples.length },
            };
        } catch {
            return unknownError;
        }
    }
}