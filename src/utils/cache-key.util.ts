export class CacheKeyUtil {
  static user(id: number): string {
    return `user:${id}`;
  }
}
