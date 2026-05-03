export const createCardSchema = {
  body: {
    type: 'object',
    required: ['title', 'imageBase64', 'imageMimeType'],
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      releaseName: { type: 'string' },
      albumName: { type: 'string' },
      eventName: { type: 'string' },
      people: {
        type: 'array',
        items: { type: 'string' },
      },
      imageBase64: { type: 'string', minLength: 1 },
      imageMimeType: {
        type: 'string',
        enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      },
    },
  },
};

export const listCardsSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      offset: { type: 'integer', minimum: 0 },
      liked: {
        anyOf: [
          { type: 'boolean' },
          { type: 'string', enum: ['true', 'false'] },
        ],
      },
    },
  },
};

export const cardParamsSchema = {
  params: {
    type: 'object',
    required: ['cardId'],
    properties: {
      cardId: { type: 'integer' },
    },
  },
};
