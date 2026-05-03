import 'dotenv/config';
import pg from 'pg';
import zlib from 'node:zlib';
import { putImageObject } from '../src/clients/s3.js';
import { hashPassword } from '../src/utils/password.js';
import { addDays, addMinutes, hashToken } from '../src/utils/tokens.js';

type SeedUser = {
  login: string;
  email: string;
  name: string;
  password: string;
};

type SeedCard = {
  title: string;
  description: string;
  releaseName: string;
  albumName: string;
  eventName: string;
  people: string[];
  createdByLogin: string;
  imageKey: string;
  image: Buffer;
};

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cards_app',
});

const users: SeedUser[] = [
  {
    login: 'alex',
    email: 'alex@example.test',
    name: 'Alex Demo',
    password: 'test',
  },
  {
    login: 'mira',
    email: 'mira@example.test',
    name: 'Mira Demo',
    password: 'password123',
  },
];

const cards: SeedCard[] = [
  ...albumCards({
    albumName: '★★★★★ (5-STAR)',
    releaseName: 'Stray Kids 3rd Full Album',
    eventName: '5-STAR Release',
    createdByLogin: 'alex',
    tracks: [
      'Hall of Fame',
      'S-Class',
      'ITEM',
      'Super Bowl',
      'TOPLINE (feat. Tiger JK)',
      'DLC',
      'GET LIT',
      'Collision',
      'FNF',
      'Youtiful',
      'THE SOUND (Korean Ver.)',
      'Mixtape : Time Out',
    ],
    palette: [
      [19, 31, 55],
      [45, 212, 191],
      [244, 114, 182],
    ],
  }),
  ...albumCards({
    albumName: '樂-STAR (ROCK-STAR)',
    releaseName: 'Stray Kids 8th Mini Album',
    eventName: 'ROCK-STAR Release',
    createdByLogin: 'mira',
    tracks: [
      'MEGAVERSE',
      'LALALALA',
      'BLIND SPOT',
      'COMFLEX',
      'Cover Me',
      'Leave',
      'Social Path (feat. LiSA) (Korean Ver.)',
      'LALALALA (Rock Ver.)',
    ],
    palette: [
      [24, 24, 27],
      [251, 191, 36],
      [248, 113, 113],
    ],
  }),
];

const accessToken = 'seed-access-token-alex';
const refreshToken = 'seed-refresh-token-alex';

try {
  await client.connect();
  await client.query('BEGIN');
  await client.query('TRUNCATE card_reactions, cards, sessions, users RESTART IDENTITY CASCADE');

  const userIds = new Map<string, number>();
  for (const user of users) {
    const { salt, passwordHash } = hashPassword(user.password);
    const { rows } = await client.query(
      `INSERT INTO users (login, email, name, password_hash, password_salt)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [user.login, user.email, user.name, passwordHash, salt],
    );
    userIds.set(user.login, rows[0].id);
  }

  const cardIds = new Map<string, number>();
  for (const card of cards) {
    await putImageObject(card.imageKey, card.image, 'image/png');

    const { rows } = await client.query(
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'image/png', $8)
       RETURNING id`,
      [
        card.title,
        card.description,
        card.releaseName,
        card.albumName,
        card.eventName,
        card.people,
        card.imageKey,
        userIds.get(card.createdByLogin),
      ],
    );
    cardIds.set(card.title, rows[0].id);
  }

  const now = new Date();
  await client.query(
    `INSERT INTO sessions (
       user_id,
       access_token_hash,
       refresh_token_hash,
       access_expires_at,
       refresh_expires_at,
       device,
       user_ip
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userIds.get('alex'),
      hashToken(accessToken),
      hashToken(refreshToken),
      addMinutes(now, 60),
      addDays(now, 7),
      'Seed script',
      '127.0.0.1',
    ],
  );

  await client.query(
    `INSERT INTO card_reactions (user_id, card_id, reaction_type)
     VALUES ($1, $2, 'like'), ($3, $4, 'like'), ($5, $6, 'favorite')`,
    [
      userIds.get('alex'),
      cardIds.get('S-Class'),
      userIds.get('mira'),
      cardIds.get('LALALALA'),
      userIds.get('alex'),
      cardIds.get('MEGAVERSE'),
    ],
  );

  await client.query('COMMIT');

  console.info('Seed completed');
  console.info(`Users: ${users.map((user) => `${user.login}/${user.password}`).join(', ')}`);
  console.info(`Active access token for alex: ${accessToken}`);
} catch (err) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw err;
} finally {
  await client.end();
}

function createPng(width: number, height: number, colors: number[][]): Buffer {
  const bytesPerPixel = 4;
  const raw = Buffer.alloc((width * bytesPerPixel + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * bytesPerPixel + 1);
    raw[rowStart] = 0;

    for (let x = 0; x < width; x++) {
      const ratio = x / Math.max(width - 1, 1);
      const band = Math.min(colors.length - 1, Math.floor(ratio * colors.length));
      const color = colors[band];
      const offset = rowStart + 1 + x * bytesPerPixel;
      const shine = Math.round(32 * Math.sin((x + y) / 28));

      raw[offset] = clamp(color[0] + shine);
      raw[offset + 1] = clamp(color[1] + shine);
      raw[offset + 2] = clamp(color[2] + shine);
      raw[offset + 3] = 255;
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', Buffer.concat([
      uint32(width),
      uint32(height),
      Buffer.from([8, 6, 0, 0, 0]),
    ])),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function albumCards({
  albumName,
  createdByLogin,
  eventName,
  palette,
  releaseName,
  tracks,
}: {
  albumName: string;
  createdByLogin: string;
  eventName: string;
  palette: number[][];
  releaseName: string;
  tracks: string[];
}): SeedCard[] {
  return tracks.map((track, index) => ({
    title: track,
    description: `${track} card from ${albumName}.`,
    releaseName,
    albumName,
    eventName,
    people: ['Bang Chan', 'Lee Know', 'Changbin', 'Hyunjin', 'HAN', 'Felix', 'Seungmin', 'I.N'],
    createdByLogin,
    imageKey: `cards/stray-kids/${slugify(albumName)}/${String(index + 1).padStart(2, '0')}-${slugify(track)}.png`,
    image: createPng(1000, 1517, rotatePalette(palette, index)),
  }));
}

function rotatePalette(palette: number[][], offset: number) {
  return palette.map((_, index) => palette[(index + offset) % palette.length]);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/★/g, 'star')
    .replace(/樂/g, 'rock')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  return Buffer.concat([
    uint32(data.length),
    typeBuffer,
    data,
    uint32(crc32(Buffer.concat([typeBuffer, data]))),
  ]);
}

function uint32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}
