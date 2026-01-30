import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';
import { SupabasePresenceIntervalRepository } from '../SupabasePresenceIntervalRepository';

describe('Integration | SupabasePresenceIntervalRepository', () => {
    const repo = new SupabasePresenceIntervalRepository(supabaseClient as any);

    beforeAll(async () => {
        await initBiometricsTestDatabase();
    });

    it('findLatestByPatient returns latest interval', async () => {
        const seed = await initBiometricsTestDatabase();
        const latest = await repo.findLatestByPatient(seed.patientUserId);

        expect(latest).toBeTruthy();
        expect(latest!.patientId).toBe(seed.patientUserId);
        expect(latest!.contextType).toBe('dashboard');
    });

    it('extends interval', async () => {
        const seed = await initBiometricsTestDatabase();
        const latest = await repo.findLatestByPatient(seed.patientUserId);

        const end = new Date(new Date(latest!.endMinuteUtc).getTime() + 60_000).toISOString();
        const updated = await repo.extendInterval(latest!.id as string, end);

        expect(updated.endMinuteUtc).toBe(end);
    });
});
