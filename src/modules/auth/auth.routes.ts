import { protect } from '../../plugins/route-guards.js';
import {
  closeSession,
  login,
  logout,
  me,
  refresh,
  register,
  sessions,
} from './auth.controller.js';
import type { SessionParams } from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  sessionParamsSchema,
} from './auth.schema.js';
import type { FastifyInstance } from 'fastify';
import type { LoginPayload, RegisterPayload } from '../../types/domain.js';

export default async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterPayload }>('/register', { schema: registerSchema }, register);
  app.post<{ Body: LoginPayload }>('/login', { schema: loginSchema }, login);
  app.post('/refresh', refresh);
  app.post('/logout', logout);

  protect(app, (protectedApp) => {
    protectedApp.get('/me', me);
    protectedApp.get('/sessions', sessions);
    protectedApp.delete<{ Params: SessionParams }>('/sessions/:sessionId', {
      schema: sessionParamsSchema,
    }, closeSession);
  })
}
