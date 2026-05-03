import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sqlFiles = [
  path.join(rootDir, 'src', 'db', 'migrations', 'reset-drop.sql'),
  path.join(rootDir, 'src', 'db', 'migrations', '001_init.sql'),
];

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cards_app',
});

try {
  await client.connect();

  for (const sqlPath of sqlFiles) {
    const sql = await fs.readFile(sqlPath, 'utf8');
    await client.query(sql);
  }

  console.info('Database reset completed');
} finally {
  await client.end();
}
