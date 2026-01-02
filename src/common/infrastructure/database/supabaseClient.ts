import dotenv from 'dotenv';
dotenv.config();

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./supabaseTypes";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan variables de entorno: SUPABASE_URL o SUPABASE_ANON_KEY');
}

export type DBClientService = SupabaseClient<Database>;

export const supabaseClient: DBClientService = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey
);