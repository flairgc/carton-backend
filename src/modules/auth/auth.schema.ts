export const registerSchema = {
  body: {
    type: 'object',
    required: ['login', 'password'],
    additionalProperties: false,
    properties: {
      login: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 },
      email: { type: 'string' },
      name: { type: 'string' },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['login', 'password'],
    additionalProperties: false,
    properties: {
      login: { type: 'string', minLength: 1 },
      password: { type: 'string', minLength: 1 },
    },
  },
};

export const refreshSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      refreshToken: { type: 'string' },
    },
  },
};

export const sessionParamsSchema = {
  params: {
    type: 'object',
    required: ['sessionId'],
    properties: {
      sessionId: { type: 'integer' },
    },
  },
};
