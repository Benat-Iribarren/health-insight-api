import { SupabaseSessionMetricsRepository } from '../repositories/SupabaseSessionMetricsRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initBiometricsTestDatabase } from '@common/infrastructure/database/test-seeds/biometrics.seed';

describe('SupabaseSessionMetricsRepository', () => {
    const repo = new SupabaseSessionMetricsRepository(supabaseClient);

    it('should retrieve seeded session data', async () => {
        const seed = await initBiometricsTestDatabase();
        const data = await repo.getFullSessionContext(seed.patientId);

        expect(data.sessions.length).toBe(1);
        //expect(data.sessions[0].id).toBe(seed.patientSessionId);
    });
});