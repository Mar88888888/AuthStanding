import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { NewUser, User } from './user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { db as drizzleClient } from '../db/drizzle.provider';
import { users } from '../db/schema';
import { or, eq, and } from 'drizzle-orm';
import { hashPassword } from '../utils/hashing.utils';
import Redis from 'ioredis';
import { CacheKeyUtil } from '../utils/cache-key.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('DRIZZLE')
    private readonly db: typeof drizzleClient,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, userData.email),
          eq(users.username, userData.username),
        ),
      )
      .limit(1);

    if (existingUser.length > 0) {
      const conflictField =
        existingUser[0].email === userData.email ? 'email' : 'username';

      throw new ConflictException(
        `User with this ${conflictField} already exists`,
      );
    }

    userData.password = await hashPassword(userData.password);

    const newUser: NewUser = {
      email: userData.email,
      username: userData.username,
      password: userData.password,
      fullName: userData.fullName,
      birthday: userData.birthday.toISOString(),
    };

    try {
      const [insertedUser] = await this.db
        .insert(users)
        .values(newUser)
        .returning();

      this.logger.log(
        `User created successfully: ${insertedUser.email} ID: ${insertedUser.id}`,
      );

      return insertedUser;
    } catch (error) {
      this.logger.error(
        `Error creating user: ${error instanceof Error && error.message}`,
      );
      throw error;
    }
  }

  async findOne(
    query: Partial<Record<keyof typeof users.$inferSelect, any>>,
  ): Promise<User | undefined> {
    const conditions = Object.entries(query).map(([key, value]) =>
      eq(users[key], value),
    );

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (user?.id) {
      const cacheKey = CacheKeyUtil.user(user.id);
      await this.redisClient.set(cacheKey, JSON.stringify(user), 'EX', 60 * 10);
    }

    return user;
  }

  async findOneById(id: number): Promise<User | undefined> {
    const cacheKey = CacheKeyUtil.user(id);
    const cached = await this.redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as User;
    }

    const user = await this.findOne({ id });

    if (user) {
      await this.redisClient.set(cacheKey, JSON.stringify(user), 'EX', 60 * 10);
    }

    return user;
  }
}
