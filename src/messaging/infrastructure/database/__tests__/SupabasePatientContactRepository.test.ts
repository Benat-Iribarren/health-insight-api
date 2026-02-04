import { SupabasePatientContactRepository } from '../SupabasePatientContactRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

describe('Integration | SupabasePatientContactRepository', () => {
  const repository = new SupabasePatientContactRepository(supabaseClient);

  it('returns the email string for a valid patient', async () => {
    const { patientId } = await initMessagingTestDatabase();

    const email = await repository.getEmailByPatientId(patientId);

    expect(typeof email).toBe('string');
    expect(email).toContain('@competition.com');
  });

  it('returns null if the patient does not exist', async () => {
    await initMessagingTestDatabase();
    const email = await repository.getEmailByPatientId(999999);

    expect(email).toBeNull();
  });
});
