import 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@common/infrastructure/database/supabaseTypes';

declare module 'fastify' {
    interface FastifyInstance {
        supabase: SupabaseClient<Database>;
    }

    interface FastifyRequest {
        auth?: {
            userId: string;
            patientId?: number;
        };
    }
}
