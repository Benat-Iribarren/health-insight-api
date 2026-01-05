import { SupabasePatientContactRepository } from '../SupabasePatientContactRepository';
import { supabaseClient } from '@common/infrastructure/database/supabaseClient';
import { initTestDatabase } from '@common/infrastructure/database/initTestDatabase';
import { randomUUID } from 'node:crypto';

describe('SupabasePatientContactRepository', () => {
    const repository = new SupabasePatientContactRepository(supabaseClient);
    let seededPatientId: number;

    beforeAll(async () => {
        const seed = await initTestDatabase();
        seededPatientId = seed.patientId;
    });

    test('should return the correct email for the dynamic seeded patient', async () => {
        const email = await repository.getEmailByPatientId(seededPatientId);
        expect(email).toBe('benat@test.com');
    });

    test('should return null when the patient id does not exist', async () => {
        const email = await repository.getEmailByPatientId(999999);
        expect(email).toBeNull();
    });

    test('should return null when the patient email is an empty string', async () => {
        const uniqueUser = randomUUID();

        const { data, error } = await supabaseClient.from('Patient').insert({
            user_id: uniqueUser,
            name: 'Sin Email',
            surname: 'Test',
            email: '',
            phone: '000',
            birth_date: '1990-01-01',
            gender: 'M',
            username: `tmp_${uniqueUser.substring(0, 5)}`
        }).select().single();

        if (error || !data) {
            throw new Error(`Fallo al insertar paciente sin email: ${error?.message}`);
        }

        const email = await repository.getEmailByPatientId(data.id);
        expect(email).toBeNull();
    });
});