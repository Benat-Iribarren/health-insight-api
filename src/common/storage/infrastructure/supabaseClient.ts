import { createClient } from "@supabase/supabase-js";
import type { Database } from "../domain/db";
import type { DBClientService } from "../domain/DBClientService";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(`MISSING_ENV_VARS: Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env`);
}

export const supabaseClient: DBClientService = createClient<Database>(
    supabaseUrl,
    supabasePublishableKey
);