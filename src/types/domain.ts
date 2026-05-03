export type AppConfig = {
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  WEB_ORIGIN: string;
  COOKIE_SECURE: boolean;
  BODY_LIMIT_MB: number;
  ACCESS_TOKEN_TTL_MINUTES: number;
  REFRESH_TOKEN_TTL_DAYS: number;
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_FORCE_PATH_STYLE: boolean;
};

export type User = {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  created_at?: Date;
};

export type UserWithPassword = User & {
  password_hash: string;
  password_salt: string;
};

export type AuthMeta = {
  userAgent?: string;
  userIp?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
};

export type RegisterPayload = {
  login: string;
  password: string;
  email?: string;
  name?: string;
};

export type LoginPayload = {
  login: string;
  password: string;
};

export type CardPayload = {
  title: string;
  description?: string;
  releaseName?: string;
  albumName?: string;
  eventName?: string;
  people?: string[];
  imageBase64: string;
  imageMimeType: string;
};

export type CardsQuery = {
  limit?: number;
  offset?: number;
  liked?: boolean | string;
};
