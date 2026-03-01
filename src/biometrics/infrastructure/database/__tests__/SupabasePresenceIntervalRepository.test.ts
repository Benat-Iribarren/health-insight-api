import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';
import { SupabasePresenceIntervalRepository } from '../repositories/SupabasePresenceIntervalRepository';

describe('Integration | SupabasePresenceIntervalRepository', () => {
    const repo = new SupabasePresenceIntervalRepository(supabaseClient);

    it('findLatestByPatient returns latest interval', async () => {
        const seed = await initBiometricsTestDatabase();
        const latest = await repo.findLatestByPatient(seed.patientId);

        expect(latest).toBeTruthy();
        expect(latest!.patientId).toBe(seed.patientId);
    });

    it('extends interval', async () => {
        const seed = await initBiometricsTestDatabase();
        const latest = await repo.findLatestByPatient(seed.patientId);

        const newEnd = new Date(new Date(latest!.endMinuteUtc).getTime() + 60000).toISOString();
        await repo.extendInterval(latest!.id, newEnd);

        const updated = await repo.findLatestByPatient(seed.patientId);
        expect(updated!.endMinuteUtc).toBe(newEnd);
    });
});