import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { NewUser, User } from './user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { db as drizzleClient } from '../db/drizzle.provider';
import { users } from '../db/schema';
import { or, eq, and } from 'drizzle-orm';
import { hashPassword } from '../utils/hashing.utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject('DRIZZLE') private readonly db: typeof drizzleClient) {}

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
  ): Promise<User> {
    const conditions = Object.entries(query).map(([key, value]) =>
      eq(users[key], value),
    );

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    return user;
  }
}
