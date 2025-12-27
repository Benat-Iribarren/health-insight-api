import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { Database } from '../domain/db';

const dialect = new PostgresDialect({
    pool: new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }),
});

export const db = new Kysely<Database>({
    dialect,
});