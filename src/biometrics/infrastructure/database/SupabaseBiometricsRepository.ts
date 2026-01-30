import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@common/infrastructure/database/supabaseTypes';
import { BiometricMinutesRepository } from '../../domain/interfaces/BiometricMinutesRepository';

export class SupabaseBiometricsRepository implements BiometricMinutesRepository {
    constructor(private readonly client: SupabaseClient<Database>) {}

    async upsertBiometricMinutes(rows: any[]): Promise<void> {
        const { error } = await this.client
            .from('BiometricMinutes')
            .upsert(rows, { onConflict: 'timestamp_iso' });

        if (error) throw error;
    }
}