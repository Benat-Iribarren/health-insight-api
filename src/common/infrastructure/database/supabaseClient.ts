import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabaseTypes";

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

export type DBClientService = SupabaseClient<Database>;

export const supabaseClient: DBClientService = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: { persistSession: false },
        db: { schema: 'public' }
    }
);
