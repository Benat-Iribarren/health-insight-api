import { SupabaseClient } from '@supabase/supabase-js';
import { BiometricMinutesRepository } from '../../../domain/interfaces/BiometricMinutesRepository';
import { BiometricSample } from '../../../domain/models/BiometricSample';
import { mapBiometricSampleInsert } from '../mappers/mapBiometricSampleInsert';

export class SupabaseBiometricMinutesRepository implements BiometricMinutesRepository {
    constructor(private readonly client: SupabaseClient) {}

    async upsertBiometricMinutes(samples: BiometricSample[]): Promise<void> {
        const toInsert = samples.map(mapBiometricSampleInsert);

        const { error } = await this.client
            .from('BiometricMinutes')
            .upsert(toInsert, { onConflict: 'timestamp_iso' });

        if (error) throw error;
    }
}