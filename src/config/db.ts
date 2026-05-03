import fp from 'fastify-plugin';
import pg from 'pg';
import type { FastifyInstance } from 'fastify';

async function dbPlugin(app: FastifyInstance) {
  const pool = new pg.Pool({
    connectionString: app.config.DATABASE_URL,
  });

  app.decorate('db', pool);

  app.addHook('onClose', async () => {
    await pool.end();
  });
}

export default fp(dbPlugin, { name: 'db' });
