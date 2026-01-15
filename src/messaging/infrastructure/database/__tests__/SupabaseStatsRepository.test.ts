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

    it('should return an array even if the database is empty', async () => {
        await supabaseClient.from('PatientSession').delete().neq('id', 0);
        await supabaseClient.from('Patient').delete().neq('id', 0);

        const result = await repository.getAllPatientsStats();

        expect(Array.isArray(result)).toBe(true);
    });

    it('should map the session states correctly to the patient object', async () => {
        await initTestDatabase();
        const result = await repository.getAllPatientsStats();
        const patient = result.find(p => p.email === 'benat@test.com');

        expect(patient).toBeDefined();
        expect(patient?.sessions?.length).toBeGreaterThan(0);
        expect(patient?.sessions?.[0]).toHaveProperty('state');
    });
});