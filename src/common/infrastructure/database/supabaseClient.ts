import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabaseTypes";

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Faltan variables de entorno: SUPABASE_URL o SUPABASE_ANON_KEY`);
}

export type DBClientService = SupabaseClient<Database>;

export const supabaseClient: DBClientService = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey
);