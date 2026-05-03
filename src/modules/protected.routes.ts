import cardRoutes from './cards/cards.routes.js';
import type { FastifyInstance } from 'fastify';

export default async function protectedRoutes(app: FastifyInstance) {
  app.register(cardRoutes, { prefix: '/cards' });
}
