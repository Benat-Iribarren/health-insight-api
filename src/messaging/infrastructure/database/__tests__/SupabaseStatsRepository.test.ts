import { SupabaseStatsRepository } from '../SupabaseStatsRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

describe('Integration | SupabaseStatsRepository', () => {
    const repository = new SupabaseStatsRepository(supabaseClient as any);

    it('returns bulk stats for all patients with required structure', async () => {
        await initMessagingTestDatabase();

        const data = await repository.getAllPatientsStats();

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('email');
        expect(data[0]).toHaveProperty('sessions');
    });

    it('returns weekly stats for a specific patient', async () => {
        const { patientId } = await initMessagingTestDatabase();

        const stats = await repository.getWeeklyStats(patientId);

        expect(stats).not.toBeNull();
        expect(stats.id).toBe(patientId);
        expect(typeof stats.name).toBe('string');
        expect(Array.isArray(stats.sessions)).toBe(true);
    });

    it('throws an error when fetching stats for a non-existent patient', async () => {
        await initMessagingTestDatabase();
        const fakeId = 888888;

        await expect(repository.getWeeklyStats(fakeId)).rejects.toThrow();
    });
});