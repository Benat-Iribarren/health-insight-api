import { dropoutRepository } from '../repositories/SupabaseDropoutRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initClinicalIntelligenceTestDatabase } from '@common/infrastructure/database/test-seeds/clinicalIntelligence.seed';

describe('Integration | dropoutRepository (Supabase)', () => {
    const repository = dropoutRepository(supabaseClient);

    it('returns patient session data with required fields', async () => {
        await initClinicalIntelligenceTestDatabase();
        const data = await repository.getPatientSessionData();

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        const row = data[0];
        expect(typeof row.patientId).toBe('number');
        expect(typeof row.name).toBe('string');
    });

    it('filters by patientId when provided', async () => {
        const seed = await initClinicalIntelligenceTestDatabase();
        const targetId = seed.patientIdOverdue;

        const filtered = await repository.getPatientSessionData(targetId);

        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.every((r) => r.patientId === targetId)).toBe(true);
    });
});