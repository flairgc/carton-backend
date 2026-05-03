import { protect } from '../plugins/route-guards.js';
import authRoutes from './auth/auth.routes.js';
import type { FastifyInstance } from 'fastify';
import protectedRoutes from './protected.routes.js';

export default async function routes(app: FastifyInstance) {
  app.register(authRoutes, { prefix: '/auth' });

  protect(app, (protectedApp) => {
    protectedApp.register(protectedRoutes);
  })
}
