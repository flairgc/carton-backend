import 'dotenv/config';

import type { AppConfig } from '../types/domain.js';

function numberFromEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number`);
  }

  return parsed;
}

export const env: AppConfig = {
  PORT: numberFromEnv('PORT', 3001),
  HOST: process.env.HOST || '0.0.0.0',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cards_app',
  WEB_ORIGIN: process.env.WEB_ORIGIN || 'http://localhost:5173,http://localhost:8081,http://localhost:19006',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  BODY_LIMIT_MB: numberFromEnv('BODY_LIMIT_MB', 20),
  ACCESS_TOKEN_TTL_MINUTES: numberFromEnv('ACCESS_TOKEN_TTL_MINUTES', 15),
  REFRESH_TOKEN_TTL_DAYS: numberFromEnv('REFRESH_TOKEN_TTL_DAYS', 30),
  S3_ENDPOINT: process.env.S3_ENDPOINT || 'http://localhost:9000',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  S3_BUCKET: process.env.S3_BUCKET || 'cards-images',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE !== 'false',
};
