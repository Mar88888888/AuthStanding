import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

export async function hashPassword(plainText: string): Promise<string> {
  const salt = randomBytes(8).toString('hex');
  const hash = (await scrypt(plainText, salt, 32)) as Buffer;
  return `${salt}.${hash.toString('hex')}`;
}

export async function verifyPassword(
  stored: string,
  plainText: string,
): Promise<boolean> {
  const [salt, storedHash] = stored.split('.');
  const hash = (await scrypt(plainText, salt, 32)) as Buffer;
  return hash.toString('hex') === storedHash;
}
