import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sqlPath = path.join(rootDir, 'src', 'db', 'migrations', '001_init.sql');

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cards_app',
});

try {
  const sql = await fs.readFile(sqlPath, 'utf8');
  await client.connect();
  await client.query(sql);
  console.info('Database migration completed');
} finally {
  await client.end();
}
