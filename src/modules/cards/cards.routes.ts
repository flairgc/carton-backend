import { create, image, like, list, one, unlike, upload } from './cards.controller.js';
import type { CardParams } from './cards.controller.js';
import { cardParamsSchema, createCardSchema, listCardsSchema } from './cards.schema.js';
import type { FastifyInstance } from 'fastify';
import type { CardPayload, CardsQuery } from '../../types/domain.js';

export default async function cardRoutes(app: FastifyInstance) {
  app.get<{ Querystring: CardsQuery }>('/', {
    // preHandler: [app.auth],
    schema: listCardsSchema,
  }, list);

  app.post<{ Body: CardPayload }>('/', {
    // preHandler: [app.auth],
    schema: createCardSchema,
  }, create);

  app.post<{ Body: CardPayload }>('/upload', {
    schema: createCardSchema,
  }, upload);

  app.get<{ Params: CardParams }>('/:cardId', {
    // preHandler: [app.auth],
    schema: cardParamsSchema,
  }, one);

  app.get<{ Params: CardParams }>('/:cardId/image', {
    // preHandler: [app.auth],
    schema: cardParamsSchema,
  }, image);

  app.put<{ Params: CardParams }>('/:cardId/like', {
    // preHandler: [app.auth],
    schema: cardParamsSchema,
  }, like);

  app.delete<{ Params: CardParams }>('/:cardId/like', {
    // preHandler: [app.auth],
    schema: cardParamsSchema,
  }, unlike);
}
