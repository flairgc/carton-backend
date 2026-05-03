import 'dotenv/config';
import pg from 'pg';
import { copyImageObject, deleteImageObject } from '../src/clients/s3.js';

type CardImageRow = {
  id: number;
  image_storage_key: string;
};

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cards_app',
});

function normalizeKey(key: string) {
  return key.replace(/^seed\//, '');
}

try {
  await client.connect();

  const { rows } = await client.query<CardImageRow>(
    `SELECT id, image_storage_key
     FROM cards
     WHERE image_storage_key LIKE 'seed/cards/%'
     ORDER BY id`,
  );

  if (rows.length === 0) {
    console.info('No seed image keys found.');
  } else {
    await client.query('BEGIN');

    for (const row of rows) {
      const sourceKey = row.image_storage_key;
      const targetKey = normalizeKey(sourceKey);

      await copyImageObject(sourceKey, targetKey);
      await client.query(
        `UPDATE cards
         SET image_storage_key = $1,
             updated_at = now()
         WHERE id = $2`,
        [targetKey, row.id],
      );
      console.info(`Card ${row.id}: ${sourceKey} -> ${targetKey}`);
    }

    await client.query('COMMIT');

    for (const row of rows) {
      await deleteImageObject(row.image_storage_key);
    }

    console.info(`Normalized ${rows.length} card image key(s).`);
  }
} catch (err) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw err;
} finally {
  await client.end();
}
