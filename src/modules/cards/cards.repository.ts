import type { Pool } from 'pg';

type CreateCardData = {
  title: string;
  description: string | null;
  releaseName: string | null;
  albumName: string | null;
  eventName: string | null;
  people: string[];
  imageStorageKey: string;
  imageMimeType: string;
  createdBy: number;
};

type CardRow = {
  id: number;
  title: string;
  description: string | null;
  release_name: string | null;
  album_name: string | null;
  event_name: string | null;
  people: string[] | null;
  image_mime_type: string;
  image_storage_key: string;
  created_by: number;
  created_at: Date;
  likes_count?: number;
  liked_by_me?: boolean;
};

export async function createCard(db: Pool, card: CreateCardData) {
  const { rows } = await db.query(
    `INSERT INTO cards (
       title,
       description,
       release_name,
       album_name,
       event_name,
       people,
       image_storage_key,
       image_mime_type,
       created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, title, description, release_name, album_name, event_name, people, image_storage_key, image_mime_type, created_by, created_at`,
    [
      card.title,
      card.description,
      card.releaseName,
      card.albumName,
      card.eventName,
      card.people,
      card.imageStorageKey,
      card.imageMimeType,
      card.createdBy,
    ],
  );

  return mapCard(rows[0]);
}

export async function listCards(
  db: Pool,
  {
    userId,
    limit,
    offset,
    likedOnly,
  }: { userId: number; limit: number; offset: number; likedOnly?: boolean },
) {
  const { rows } = await db.query(
    `SELECT
       c.id,
       c.title,
       c.description,
       c.release_name,
       c.album_name,
       c.event_name,
       c.people,
       c.image_storage_key,
       c.image_mime_type,
       c.created_by,
       c.created_at,
       count(cr.user_id) FILTER (WHERE cr.reaction_type = 'like')::int AS likes_count,
       bool_or(cr.user_id = $1 AND cr.reaction_type = 'like') AS liked_by_me
     FROM cards c
     LEFT JOIN card_reactions cr ON cr.card_id = c.id
     WHERE (
       $4::boolean = false
       OR EXISTS (
         SELECT 1
         FROM card_reactions mine
         WHERE mine.card_id = c.id
           AND mine.user_id = $1
           AND mine.reaction_type = 'like'
       )
     )
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset, Boolean(likedOnly)],
  );

  return rows.map(mapCard);
}

export async function findCardById(db: Pool, { cardId, userId }: { cardId: number; userId: number }) {
  const { rows } = await db.query(
    `SELECT
       c.id,
       c.title,
       c.description,
       c.release_name,
       c.album_name,
       c.event_name,
       c.people,
       c.image_storage_key,
       c.image_mime_type,
       c.created_by,
       c.created_at,
       count(cr.user_id) FILTER (WHERE cr.reaction_type = 'like')::int AS likes_count,
       bool_or(cr.user_id = $2 AND cr.reaction_type = 'like') AS liked_by_me
     FROM cards c
     LEFT JOIN card_reactions cr ON cr.card_id = c.id
     WHERE c.id = $1
     GROUP BY c.id`,
    [cardId, userId],
  );

  return rows[0] ? mapCard(rows[0]) : null;
}

export async function findCardImageById(db: Pool, { cardId }: { cardId: number }): Promise<{ image_storage_key: string; image_mime_type: string } | undefined> {
  const { rows } = await db.query(
    `SELECT image_storage_key, image_mime_type
     FROM cards
     WHERE id = $1`,
    [cardId],
  );

  return rows[0];
}

function mapCard(row: CardRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    releaseName: row.release_name,
    albumName: row.album_name,
    eventName: row.event_name,
    people: row.people || [],
    imageMimeType: row.image_mime_type,
    createdBy: row.created_by,
    createdAt: row.created_at,
    likesCount: row.likes_count || 0,
    likedByMe: Boolean(row.liked_by_me),
  };
}
