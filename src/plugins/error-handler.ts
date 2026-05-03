import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((err, request, reply) => {
    request.server.log.error(err);
    reply.code(500).send({ error: 'INTERNAL_SERVER_ERROR' });
  });
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
