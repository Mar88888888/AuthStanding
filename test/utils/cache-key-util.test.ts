import { CacheKeyUtil } from '../../src/utils/cache-key.util';

describe('CacheKeyUtil', () => {
  describe('user', () => {
    it('should return correct cache key for user id', () => {
      const userId = 123;
      const expectedKey = `user:${userId}`;

      const key = CacheKeyUtil.user(userId);

      expect(key).toBe(expectedKey);
    });
  });
});
