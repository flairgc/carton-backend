import type { Pool } from 'pg';
import type { User, UserWithPassword } from '../../types/domain.js';

type CreateUserData = {
  login: string;
  email: string | null;
  name: string | null;
  passwordHash: string;
  passwordSalt: string;
};

export async function createUser(db: Pool, { login, email, name, passwordHash, passwordSalt }: CreateUserData): Promise<User> {
  const { rows } = await db.query(
    `INSERT INTO users (login, email, name, password_hash, password_salt)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, login, email, name, created_at`,
    [login, email, name, passwordHash, passwordSalt],
  );

  return rows[0];
}

export async function findUserByLogin(db: Pool, login: string): Promise<UserWithPassword | undefined> {
  const { rows } = await db.query(
    `SELECT id, login, email, name, password_hash, password_salt
     FROM users
     WHERE login = $1 AND active = true`,
    [login],
  );

  return rows[0];
}

export async function findUserById(db: Pool, id: number): Promise<User | undefined> {
  const { rows } = await db.query(
    `SELECT id, login, email, name, created_at
     FROM users
     WHERE id = $1 AND active = true`,
    [id],
  );

  return rows[0];
}
