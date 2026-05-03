import type { FastifyInstance } from 'fastify';

export function protect(
  app: FastifyInstance,
  fn: (app: FastifyInstance) => void,
) {
  app.register(async (instance) => {
    instance.addHook('preHandler', instance.auth);
    fn(instance);
  });
}
