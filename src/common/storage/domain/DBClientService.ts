import { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./db";

export type DBClientService = SupabaseClient<Database>;
