import fp from 'fastify-plugin';
import { getAccessTokenFromRequest } from '../utils/request-tokens.js';
import { getOpenSessionByAccessToken } from '../modules/sessions/sessions.repository.js';
import { hashToken } from '../utils/tokens.js';
import type { FastifyInstance } from 'fastify';

async function authPlugin(app: FastifyInstance) {
  app.decorate('auth', async (request, reply) => {
    const accessToken = getAccessTokenFromRequest(request);

    if (!accessToken) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    const session = await getOpenSessionByAccessToken(app.db, {
      accessTokenHash: hashToken(accessToken),
    });

    if (!session) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    request.user = {
      id: session.user_id,
      login: session.login,
      email: session.email,
      name: session.name,
      sessionId: session.id,
    };
  });
}

export default fp(authPlugin, { name: 'auth', dependencies: ['db'] });
