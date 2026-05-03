import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import { env } from './config/env.js';
import dbPlugin from './config/db.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import modules from './modules/index.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'production',
    bodyLimit: env.BODY_LIMIT_MB * 1024 * 1024,
  });

  app.decorate('config', env);
  app.register(cors, {
    origin: env.WEB_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'x-refresh-token'],
  });
  app.register(cookie);
  app.register(formbody);
  app.register(dbPlugin);
  app.register(authPlugin);
  app.register(errorHandlerPlugin);

  app.get('/api/health', async () => ({ ok: true }));
  app.register(modules, { prefix: '/api' });

  return app;
}
