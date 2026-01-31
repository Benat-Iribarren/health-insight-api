import { SyncDailyBiometricsService } from '../SyncDailyBiometricsService';
import { BiometricsFileSource } from '../../../domain/interfaces/BiometricsFileSource';
import { BiometricMinutesRepository } from '../../../domain/interfaces/BiometricMinutesRepository';

describe('Unit | SyncDailyBiometricsService', () => {
    it('returns INVALID_INPUT for invalid date', async () => {
        const source: BiometricsFileSource = { listDailyFiles: async () => [], getFileText: async () => '' };
        const repo: BiometricMinutesRepository = { upsertBiometricMinutes: async () => {} };

        const uc = new SyncDailyBiometricsService(source, repo);
        const result = await uc.execute('2026/01/01');

        expect(result).toBe('INVALID_INPUT');
    });

    it('unifies data across files and upserts', async () => {
        const date = '2026-01-01';
        const ts = '2026-01-01T12:00:00.000Z';

        const source: BiometricsFileSource = {
            listDailyFiles: async () => [
                { key: `x/${date}/pulse-rate.csv` } as any,
                { key: `x/${date}/eda.csv` } as any,
            ],
            getFileText: async (key: string) => {
                if (key.includes('pulse-rate')) return `timestamp_iso,pulse_rate_bpm\n${ts},80\n`;
                if (key.includes('eda')) return `timestamp_iso,eda_scl_usiemens\n${ts},1.5\n`;
                return '';
            },
        };

        const upserts: any[] = [];
        const repo: BiometricMinutesRepository = {
            upsertBiometricMinutes: async (rows: any[]) => {
                upserts.push(...rows);
            },
        };

        const uc = new SyncDailyBiometricsService(source, repo);
        const result = await uc.execute(date);

        expect(typeof result).toBe('object');
        expect((result as any).status).toBe('success');
        expect(upserts.length).toBe(1);
        expect(upserts[0]).toMatchObject({
            timestamp_iso: ts,
            pulse_rate_bpm: 80,
            eda_scl_usiemens: 1.5,
        });
    });
});
