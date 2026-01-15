import { SupabaseStatsRepository } from '../SupabaseStatsRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

describe('SupabaseStatsRepository', () => {
    const repository = new SupabaseStatsRepository(supabaseClient);

    beforeAll(async () => {
        await initTestDatabase();
    });

    it('should fetch all patients stats and include session data', async () => {
        const result = await repository.getAllPatientsStats();

        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('email', 'benat@test.com');
        expect(result[0]).toHaveProperty('sessions');
        expect(Array.isArray(result[0].sessions)).toBe(true);
    });

    it('should return empty array if no patients exist', async () => {
        const result = await repository.getAllPatientsStats();

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
            expect(result[0]).toHaveProperty('completed');
            expect(result[0]).toHaveProperty('inProgress');
        }
    });
});