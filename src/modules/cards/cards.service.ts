import {
  createCard,
  findCardById,
  findCardImageById,
  listCards,
} from './cards.repository.js';
import { removeCardReaction, setCardReaction } from '../likes/likes.repository.js';
import { getImageObject, putImageObject } from '../../clients/s3.js';
import { normalizeCardImage } from '../../utils/images.js';
import crypto from 'node:crypto';
import type { Pool } from 'pg';
import type { CardPayload, CardsQuery } from '../../types/domain.js';

const reactionType = 'like';

export async function addCard(db: Pool, userId: number, payload: CardPayload) {
  const imageData = Buffer.from(payload.imageBase64, 'base64');
  const image = await normalizeCardImage(imageData, payload.imageMimeType);
  const imageStorageKey = `cards/${crypto.randomUUID()}`;

  await putImageObject(imageStorageKey, image.data, image.mimeType);

  return createCard(db, {
    title: payload.title,
    description: payload.description || null,
    releaseName: payload.releaseName || null,
    albumName: payload.albumName || null,
    eventName: payload.eventName || null,
    people: payload.people || [],
    imageStorageKey,
    imageMimeType: image.mimeType,
    createdBy: userId,
  });
}

export async function getCards(db: Pool, userId: number, query: CardsQuery) {
  const limit = Math.min(Number(query.limit) || 30, 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const likedOnly = query.liked === true || query.liked === 'true';

  return listCards(db, { userId, limit, offset, likedOnly });
}

export async function getCard(db: Pool, userId: number, cardId: number) {
  const card = await findCardById(db, { userId, cardId });
  if (!card) {
    throw new Error('CARD_NOT_FOUND');
  }

  return card;
}

export async function getCardImage(db: Pool, cardId: number) {
  const image = await findCardImageById(db, { cardId });
  if (!image) {
    throw new Error('CARD_NOT_FOUND');
  }

  return {
    imageData: await getImageObject(image.image_storage_key),
    imageMimeType: image.image_mime_type,
  };
}

export async function likeCard(db: Pool, userId: number, cardId: number) {
  console.log('likeCard', userId, cardId);
  await setCardReaction(db, { userId, cardId, reactionType });
}

export async function unlikeCard(db: Pool, userId: number, cardId: number) {
  await removeCardReaction(db, { userId, cardId, reactionType });
}
