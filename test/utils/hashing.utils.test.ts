import { hashPassword, verifyPassword } from '../../src/utils/hashing.utils';

describe('hashing.utils', () => {
  describe('hashPassword', () => {
    it('should return a string containing salt and hash separated by a dot', async () => {
      const plainText = 'mySecret123';
      const hashed = await hashPassword(plainText);

      expect(typeof hashed).toBe('string');
      expect(hashed).toMatch(/^[0-9a-f]{16}\.[0-9a-f]{64}$/);
    });

    it('should generate different hashes for same input (due to random salt)', async () => {
      const plainText = 'samePassword';

      const hash1 = await hashPassword(plainText);
      const hash2 = await hashPassword(plainText);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password and stored hash', async () => {
      const plainText = 'correctPassword';
      const storedHash = await hashPassword(plainText);

      const result = await verifyPassword(storedHash, plainText);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainText = 'correctPassword';
      const storedHash = await hashPassword(plainText);

      const result = await verifyPassword(storedHash, 'wrongPassword');
      expect(result).toBe(false);
    });

    it('should return false for malformed stored hash', async () => {
      const malformedStored = 'invalidFormatHash';

      const result = await verifyPassword(malformedStored, 'anyPassword');
      expect(result).toBe(false);
    });
  });
});
