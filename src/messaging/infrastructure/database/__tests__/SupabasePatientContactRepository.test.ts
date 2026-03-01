import { SupabasePatientContactRepository } from '../repositories/SupabasePatientContactRepository';
import { supabaseClient } from '@src/common/infrastructure/database/supabaseClient';
import { initMessagingTestDatabase } from '@src/common/infrastructure/database/test-seeds/messaging.seed';

describe('Integration | SupabasePatientContactRepository', () => {
  const repository = new SupabasePatientContactRepository(supabaseClient);

  it('returns the contact info for a valid patient', async () => {
    const { patientId } = await initMessagingTestDatabase();

    const contact = await repository.getPatientContact(patientId);

    expect(contact).toBeDefined();
    expect(contact.email).toContain('@');
  });

  it('returns null fields if the patient does not exist', async () => {
    await initMessagingTestDatabase();
    const contact = await repository.getPatientContact(999999);

    expect(contact.email).toBeNull();
    expect(contact.name).toBeNull();
  });
});
