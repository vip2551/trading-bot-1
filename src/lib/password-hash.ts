import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  
  // دعم SHA256 القديم للترحيل
  if (hashedPassword.length === 64 && !hashedPassword.startsWith('$2')) {
    const crypto = require('crypto');
    const legacyHash = crypto
      .createHash('sha256')
      .update(password + 'trading-bot-salt')
      .digest('hex');
    return legacyHash === hashedPassword;
  }
  
  return bcrypt.compare(password, hashedPassword);
}

export function needsRehash(hashedPassword: string): boolean {
  if (!hashedPassword.startsWith('$2')) return true;
  const rounds = bcrypt.getRounds(hashedPassword);
  return rounds < SALT_ROUNDS;
}