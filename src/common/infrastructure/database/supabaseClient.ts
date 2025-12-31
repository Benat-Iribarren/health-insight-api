import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../storage/domain/db";
import type { DBClientService } from "../../storage/domain/DBClientService";
import dotenv from 'dotenv';

dotenv.config();

export const supabaseClient: DBClientService = createClient<Database>(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_ANON_KEY as string,
);