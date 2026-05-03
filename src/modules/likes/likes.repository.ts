import type { Pool } from 'pg';

type CardReactionData = {
  userId: number;
  cardId: number;
  reactionType: string;
};

export async function setCardReaction(db: Pool, { userId, cardId, reactionType }: CardReactionData) {
  await db.query(
    `INSERT INTO card_reactions (user_id, card_id, reaction_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, card_id, reaction_type) DO NOTHING`,
    [userId, cardId, reactionType],
  );
}

export async function removeCardReaction(db: Pool, { userId, cardId, reactionType }: CardReactionData) {
  await db.query(
    `DELETE FROM card_reactions
     WHERE user_id = $1 AND card_id = $2 AND reaction_type = $3`,
    [userId, cardId, reactionType],
  );
}
