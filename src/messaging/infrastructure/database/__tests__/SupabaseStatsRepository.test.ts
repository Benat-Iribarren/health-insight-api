import { SupabaseStatsRepository } from '../SupabaseStatsRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';

describe('SupabaseStatsRepository', () => {
    const repository = new SupabaseStatsRepository(supabaseClient);

    beforeAll(async () => {
        await initTestDatabase();
    });

    test('should fetch sessions within a specific date range', async () => {
        const start = new Date();
        start.setDate(start.getDate() - 10);
        const end = new Date();
        end.setDate(end.getDate() + 1);

        const result = await repository.getSessionsInRange(start, end);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('patient_name', 'Beñat');
        expect(result[0]).toHaveProperty('email', 'benat@test.com');
    });

    test('should return empty array if no sessions exist in range', async () => {
        const futureStart = new Date();
        futureStart.setFullYear(futureStart.getFullYear() + 1);
        const futureEnd = new Date();
        futureEnd.setFullYear(futureEnd.getFullYear() + 2);

        const result = await repository.getSessionsInRange(futureStart, futureEnd);

        expect(result).toEqual([]);
    });
});