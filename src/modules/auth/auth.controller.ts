import {
  closeUserSession,
  getProfile,
  getSessions,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
} from './auth.service.js';
import { clearAuthCookies, setAuthCookies } from '../../utils/cookies.js';
import { getAccessTokenFromRequest, getRefreshTokenFromRequest } from '../../utils/request-tokens.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthMeta, LoginPayload, RegisterPayload } from '../../types/domain.js';

export type SessionParams = {
  sessionId: number;
};

export async function register(request: FastifyRequest<{ Body: RegisterPayload }>, reply: FastifyReply) {
  try {
    console.log('getMeta(request)', getMeta(request));
    const result = await registerUser(request.server.db, request.server.config, request.body, getMeta(request));
    setAuthCookies(reply, request.server.config, result.tokens);
    return reply.code(201).send(result);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === '23505') {
      return reply.code(409).send({ error: 'USER_ALREADY_EXISTS' });
    }

    request.server.log.error(err);
    return reply.code(500).send({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

export async function login(request: FastifyRequest<{ Body: LoginPayload }>, reply: FastifyReply) {
  try {
    const result = await loginUser(request.server.db, request.server.config, request.body, getMeta(request));
    setAuthCookies(reply, request.server.config, result.tokens);
    return reply.send(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' });
    }

    request.server.log.error(err);
    return reply.code(500).send({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await refreshUserSession(
      request.server.db,
      request.server.config,
      getRefreshTokenFromRequest(request),
      getMeta(request),
    );
    setAuthCookies(reply, request.server.config, result.tokens);
    return reply.send(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    request.server.log.error(err);
    return reply.code(500).send({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    await logoutUser(request.server.db, getAccessTokenFromRequest(request));
    clearAuthCookies(reply, request.server.config);
    return reply.send({ message: 'LOGOUT_SUCCESS' });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }

    request.server.log.error(err);
    return reply.code(500).send({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

export async function me(request: FastifyRequest) {
  const user = await getProfile(request.server.db, request.user.id);
  return { user };
}

export async function sessions(request: FastifyRequest) {
  const items = await getSessions(request.server.db, request.user.id);
  return { sessions: items };
}

export async function closeSession(request: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) {
  try {
    await closeUserSession(request.server.db, request.user.id, request.params.sessionId);
    return reply.send({ message: 'SESSION_CLOSED' });
  } catch (err) {
    if (err instanceof Error && err.message === 'SESSION_NOT_FOUND') {
      return reply.code(404).send({ error: 'SESSION_NOT_FOUND' });
    }

    request.server.log.error(err);
    return reply.code(500).send({ error: 'INTERNAL_SERVER_ERROR' });
  }
}

function getMeta(request: FastifyRequest): AuthMeta {
  return {
    userAgent: request.headers['user-agent'],
    userIp: request.ip,
  };
}
