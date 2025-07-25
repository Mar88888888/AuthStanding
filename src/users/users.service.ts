import { Inject, Injectable } from '@nestjs/common';
import { NewUser } from './user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { db as drizzleClient } from '../db/drizzle.provider';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { users } from '../db/schema';

const scrypt = promisify(_scrypt);

@Injectable()
export class UsersService {
  constructor(@Inject('DRIZZLE') private readonly db: typeof drizzleClient) {}

  async createUser(userData: CreateUserDto): Promise<void> {
    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(userData.password, salt, 32)) as Buffer;
    const result = salt + '.' + hash.toString('hex');
    userData.password = result;

    const newUser: NewUser = {
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      birthday: userData.birthday,
    };

    await this.db.insert(users).values(newUser);
  }
}
