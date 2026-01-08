import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { SupabaseDropoutRepository } from '../SupabaseDropoutRepository';

describe('SupabaseDropoutRepository', () => {
    const repository = new SupabaseDropoutRepository(supabaseClient as any);

    beforeAll(async () => {
        await initTestDatabase();
    });

    it('should fetch raw session data from the database correctly', async () => {
        const data = await repository.getPatientSessionData();

        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('patientId');
        expect(data[0]).toHaveProperty('sessionStatus');
    });

    it('should filter data by patientId when provided', async () => {
        const allData = await repository.getPatientSessionData();
        const targetId = allData[0].patientId;

        const filteredData = await repository.getPatientSessionData(targetId);

        const allMatch = filteredData.every(row => row.patientId === targetId);
        expect(allMatch).toBe(true);
    });
});