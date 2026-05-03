import {
  addCard,
  getCard,
  getCardImage,
  getCards,
  likeCard,
  unlikeCard,
} from './cards.service.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CardPayload, CardsQuery } from '../../types/domain.js';

export type CardParams = {
  cardId: number;
};

export async function create(request: FastifyRequest<{ Body: CardPayload }>, reply: FastifyReply) {
  const card = await addCard(request.server.db, request.user.id, request.body);
  return reply.code(201).send({ card });
}

export async function upload(request: FastifyRequest<{ Body: CardPayload }>, reply: FastifyReply) {
  const card = await addCard(request.server.db, request.user.id, request.body);
  return reply.code(201).send({ card });
}

export async function list(request: FastifyRequest<{ Querystring: CardsQuery }>) {
  const cards = await getCards(request.server.db, request.user.id, request.query);
  return { cards };
}

export async function one(request: FastifyRequest<{ Params: CardParams }>, reply: FastifyReply) {
  try {
    const card = await getCard(request.server.db, request.user.id, request.params.cardId);
    return reply.send({ card });
  } catch (err) {
    if (err instanceof Error && err.message === 'CARD_NOT_FOUND') {
      return reply.code(404).send({ error: 'CARD_NOT_FOUND' });
    }
    throw err;
  }
}

export async function image(request: FastifyRequest<{ Params: CardParams }>, reply: FastifyReply) {
  try {
    const cardImage = await getCardImage(request.server.db, request.params.cardId);
    return reply.type(cardImage.imageMimeType).send(cardImage.imageData);
  } catch (err) {
    if (err instanceof Error && err.message === 'CARD_NOT_FOUND') {
      return reply.code(404).send({ error: 'CARD_NOT_FOUND' });
    }
    throw err;
  }
}

export async function like(request: FastifyRequest<{ Params: CardParams }>, reply: FastifyReply) {
  await likeCard(request.server.db, request.user.id, request.params.cardId);
  return reply.code(204).send();
}

export async function unlike(request: FastifyRequest<{ Params: CardParams }>, reply: FastifyReply) {
  await unlikeCard(request.server.db, request.user.id, request.params.cardId);
  return reply.code(204).send();
}
