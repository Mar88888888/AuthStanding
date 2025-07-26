import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const isTest = process.env.NODE_ENV === 'test';
const connectionString = isTest
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL or TEST_DATABASE_URL');
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool);
