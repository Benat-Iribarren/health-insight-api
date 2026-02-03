import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabaseTypes";

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NODE_ENV === 'test'
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
    : process.env.SUPABASE_ANON_KEY;

export type DBClientService = SupabaseClient<Database>;

export const supabaseClient: DBClientService = createClient<Database>(
    supabaseUrl,
    supabaseKey as string,
    {
        auth: { persistSession: false },
        db: { schema: 'public' }
    }
);