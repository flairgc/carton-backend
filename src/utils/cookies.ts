import type { FastifyReply } from 'fastify';
import type { AppConfig, AuthTokens } from '../types/domain.js';

const sameSite = 'lax';

export function setAuthCookies(reply: FastifyReply, config: AppConfig, tokens: AuthTokens): void {
  reply
    .setCookie('accessToken', tokens.accessToken, {
      path: '/',
      httpOnly: true,
      sameSite,
      secure: config.COOKIE_SECURE,
    })
    .setCookie('refreshToken', tokens.refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite,
      secure: config.COOKIE_SECURE,
    });
}

export function clearAuthCookies(reply: FastifyReply, config: AppConfig): void {
  reply
    .clearCookie('accessToken', {
      path: '/',
      httpOnly: true,
      sameSite,
      secure: config.COOKIE_SECURE,
    })
    .clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      sameSite,
      secure: config.COOKIE_SECURE,
    });
}
