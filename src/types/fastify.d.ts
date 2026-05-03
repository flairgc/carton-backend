import type { Pool } from 'pg';
import type { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: typeof env;
    db: Pool;
    auth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      id: number;
      login: string;
      email: string | null;
      name: string | null;
      sessionId: number;
    };
  }
}
