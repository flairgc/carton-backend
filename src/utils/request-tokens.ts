import type { FastifyRequest } from 'fastify';

type BodyWithRefreshToken = {
  refreshToken?: string;
};

export function getAccessTokenFromRequest(request: FastifyRequest): string | undefined {
  const header = request.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }

  const headerToken = request.headers['x-access-token'];
  return request.cookies?.accessToken || (Array.isArray(headerToken) ? headerToken[0] : headerToken);
}

export function getRefreshTokenFromRequest(request: FastifyRequest): string | undefined {
  const headerToken = request.headers['x-refresh-token'];
  const body = request.body as BodyWithRefreshToken | undefined;
  return request.cookies?.refreshToken || (Array.isArray(headerToken) ? headerToken[0] : headerToken) || body?.refreshToken;
}
