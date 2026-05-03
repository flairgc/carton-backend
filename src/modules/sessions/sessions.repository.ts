import type { Pool } from 'pg';

type CreateSessionData = {
  userId: number;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  device: string | null;
  userIp: string | null;
};

export type OpenSession = {
  id: number;
  user_id: number;
  login: string;
  email: string | null;
  name: string | null;
};

export async function createSession(db: Pool, session: CreateSessionData) {
  const { rows } = await db.query(
    `INSERT INTO sessions (
       user_id,
       access_token_hash,
       refresh_token_hash,
       access_expires_at,
       refresh_expires_at,
       device,
       user_ip
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, created_at, access_expires_at, refresh_expires_at, device, user_ip`,
    [
      session.userId,
      session.accessTokenHash,
      session.refreshTokenHash,
      session.accessExpiresAt,
      session.refreshExpiresAt,
      session.device,
      session.userIp,
    ],
  );

  return rows[0];
}

export async function getOpenSessionByAccessToken(db: Pool, { accessTokenHash }: { accessTokenHash: string }): Promise<OpenSession | undefined> {
  const { rows } = await db.query(
    `SELECT
       s.id,
       s.user_id,
       s.device,
       s.user_ip,
       s.created_at,
       u.login,
       u.email,
       u.name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.access_token_hash = $1
       AND s.closed_at IS NULL
       AND s.access_expires_at > now()
       AND u.active = true`,
    [accessTokenHash],
  );

  return rows[0];
}

export async function closeSessionByRefreshToken(db: Pool, { refreshTokenHash }: { refreshTokenHash: string }): Promise<{ user_id: number } | undefined> {
  const { rows } = await db.query(
    `UPDATE sessions
     SET closed_at = now()
     WHERE refresh_token_hash = $1
       AND closed_at IS NULL
       AND refresh_expires_at > now()
     RETURNING user_id`,
    [refreshTokenHash],
  );

  return rows[0];
}

export async function closeSessionByAccessToken(db: Pool, { accessTokenHash }: { accessTokenHash: string }) {
  const { rows } = await db.query(
    `UPDATE sessions
     SET closed_at = now()
     WHERE access_token_hash = $1
       AND closed_at IS NULL
     RETURNING id`,
    [accessTokenHash],
  );

  return rows[0];
}

export async function closeSessionById(db: Pool, { sessionId, userId }: { sessionId: number; userId: number }) {
  const { rows } = await db.query(
    `UPDATE sessions
     SET closed_at = now()
     WHERE id = $1
       AND user_id = $2
       AND closed_at IS NULL
     RETURNING id`,
    [sessionId, userId],
  );

  return rows[0];
}

export async function listUserSessions(db: Pool, { userId }: { userId: number }) {
  const { rows } = await db.query(
    `SELECT
       id,
       created_at,
       closed_at,
       access_expires_at,
       refresh_expires_at,
       device,
       user_ip
     FROM sessions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows;
}
