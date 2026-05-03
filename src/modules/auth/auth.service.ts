import { createUser, findUserById, findUserByLogin } from '../users/users.repository.js';
import {
  closeSessionByAccessToken,
  closeSessionById,
  closeSessionByRefreshToken,
  createSession,
  listUserSessions,
} from '../sessions/sessions.repository.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { addDays, addMinutes, generateToken, hashToken } from '../../utils/tokens.js';
import type { Pool } from 'pg';
import type { AppConfig, AuthMeta, LoginPayload, RegisterPayload, User, UserWithPassword } from '../../types/domain.js';

export async function registerUser(db: Pool, config: AppConfig, payload: RegisterPayload, meta: AuthMeta) {
  const { salt, passwordHash } = hashPassword(payload.password);
  const user = await createUser(db, {
    login: payload.login,
    email: payload.email || null,
    name: payload.name || null,
    passwordHash,
    passwordSalt: salt,
  });
  const tokens = await createUserSession(db, config, user.id, meta);

  return { user, tokens };
}

export async function loginUser(db: Pool, config: AppConfig, payload: LoginPayload, meta: AuthMeta) {
  const user = await findUserByLogin(db, payload.login);

  if (!user || !verifyPassword(payload.password, user.password_salt, user.password_hash)) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const tokens = await createUserSession(db, config, user.id, meta);

  return {
    user: sanitizeUser(user),
    tokens,
  };
}

export async function refreshUserSession(db: Pool, config: AppConfig, refreshToken: string | undefined, meta: AuthMeta) {
  if (!refreshToken) {
    throw new Error('UNAUTHORIZED');
  }

  const closedSession = await closeSessionByRefreshToken(db, {
    refreshTokenHash: hashToken(refreshToken),
  });

  if (!closedSession) {
    throw new Error('UNAUTHORIZED');
  }

  const user = await findUserById(db, closedSession.user_id);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  const tokens = await createUserSession(db, config, closedSession.user_id, meta);

  return { user, tokens };
}

export async function logoutUser(db: Pool, accessToken: string | undefined) {
  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  await closeSessionByAccessToken(db, {
    accessTokenHash: hashToken(accessToken),
  });
}

export async function getProfile(db: Pool, userId: number) {
  return findUserById(db, userId);
}

export async function getSessions(db: Pool, userId: number) {
  return listUserSessions(db, { userId });
}

export async function closeUserSession(db: Pool, userId: number, sessionId: number) {
  const closed = await closeSessionById(db, { userId, sessionId });
  if (!closed) {
    throw new Error('SESSION_NOT_FOUND');
  }
}

async function createUserSession(db: Pool, config: AppConfig, userId: number, meta: AuthMeta) {
  const now = new Date();
  const accessToken = generateToken();
  const refreshToken = generateToken();
  const accessExpiresAt = addMinutes(now, config.ACCESS_TOKEN_TTL_MINUTES);
  const refreshExpiresAt = addDays(now, config.REFRESH_TOKEN_TTL_DAYS);

  await createSession(db, {
    userId,
    accessTokenHash: hashToken(accessToken),
    refreshTokenHash: hashToken(refreshToken),
    accessExpiresAt,
    refreshExpiresAt,
    device: meta.userAgent || null,
    userIp: meta.userIp || null,
  });

  return {
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt,
  };
}

function sanitizeUser(user: User | UserWithPassword): User {
  return {
    id: user.id,
    login: user.login,
    email: user.email,
    name: user.name,
  };
}
