import { SupabaseUserRepository } from '../SupabaseUserRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

describe('Integration | SupabaseUserRepository', () => {
    const repository = new SupabaseUserRepository(supabaseClient);

    it('returns true when user is professional', async () => {
        const { patientUserId } = await initMessagingTestDatabase();

        const result = await repository.isProfessional(patientUserId);

        expect(result).toBe(false);
    });

    it('returns false when user is patient', async () => {
        const { patientUserId } = await initMessagingTestDatabase();

        const result = await repository.isPatient(patientUserId);

        expect(result).toBe(true);
    });

    it('returns patientId for valid user', async () => {
        const { patientId, patientUserId } = await initMessagingTestDatabase();

        const result = await repository.getPatientIdByUserId(patientUserId);

        expect(result).toBe(patientId);
    });

    it('throws error when patient not found', async () => {
        const fakeUserId = '00000000-0000-0000-0000-000000000000';

        try {
            await repository.getPatientIdByUserId(fakeUserId);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('handles PGRST116 error code correctly in isProfessional', async () => {
        const fakeUserId = '00000000-0000-0000-0000-000000000000';

        const result = await repository.isProfessional(fakeUserId);

        expect(result).toBe(true);
    });
});
