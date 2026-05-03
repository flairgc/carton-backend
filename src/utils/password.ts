import crypto from 'crypto';

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, passwordHash };
}

export function verifyPassword(password: string, salt: string, passwordHash: string): boolean {
  const currentHash = crypto.scryptSync(password, salt, 64);
  const savedHash = Buffer.from(passwordHash, 'hex');

  if (currentHash.length !== savedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(currentHash, savedHash);
}
