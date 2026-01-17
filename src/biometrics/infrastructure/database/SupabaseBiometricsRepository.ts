import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@common/infrastructure/database/supabaseTypes';

export class SupabaseBiometricsRepository {
    constructor(private readonly client: SupabaseClient<Database>) {}

    async upsertBiometricMinutes(data: any[]) {
        const { error } = await this.client
            .from('BiometricMinutes')
            .upsert(data, {
                onConflict: 'timestamp_iso'
            });

        if (error) throw error;
    }
}