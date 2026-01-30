import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initClinicalIntelligenceTestDatabase } from '@common/infrastructure/database/test-seeds/clinicalIntelligence.seed';
import { dropoutRepository } from '../SupabaseDropoutRepository';

describe('Integration | dropoutRepository (Supabase)', () => {
    const repository = dropoutRepository(supabaseClient as any);

    beforeAll(async () => {
        await initClinicalIntelligenceTestDatabase();
    });

    it('returns patient session data with required fields', async () => {
        const data = await repository.getPatientSessionData();

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);

        const row = data[0];
        expect(typeof row.patientId).toBe('number');
        expect(typeof row.sessionId).toBe('number');
        expect(typeof row.sessionStatus).toBe('string');
        expect(typeof row.assignedDate).toBe('string');
        expect(typeof row.name).toBe('string');
    });

    it('filters by patientId when provided', async () => {
        const all = await repository.getPatientSessionData();
        const targetId = all[0].patientId;

        const filtered = await repository.getPatientSessionData(targetId);

        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.every((r) => r.patientId === targetId)).toBe(true);
    });
});
