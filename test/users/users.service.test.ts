import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { UsersService } from '../../src/users/users.service';
import { db } from '../../src/db/drizzle.provider';
import { hashPassword } from '../../src/utils/hashing.utils';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { User } from '../../src/users/user.type';
import { users } from '../../src/db/schema';
import { or, eq, and } from 'drizzle-orm';

jest.mock('../../src/db/drizzle.provider', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  },
}));

jest.mock('../../src/utils/hashing.utils', () => ({
  hashPassword: jest.fn(),
}));

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
    })),
  };
});

jest.mock('../../src/utils/cache-key.util', () => ({
  CacheKeyUtil: {
    user: jest.fn((id: number) => `user:${id}`),
  },
}));

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: typeof db;
  let mockRedisClient: jest.Mocked<Redis>;
  let mockHashPassword: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'DRIZZLE',
          useValue: db,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: new (Redis as any)(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockDb = module.get<typeof db>('DRIZZLE');
    mockRedisClient = module.get<Redis>('REDIS_CLIENT') as jest.Mocked<Redis>;
    mockHashPassword = hashPassword as jest.Mock;

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const originalPassword = 'password123';
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      fullName: 'Test User',
      birthday: new Date('1990-01-01'),
    };

    const hashedPassword = 'hashedPassword123';
    const newUserResult: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      fullName: 'Test User',
      birthday: '1990-01-01T00:00:00.000Z',
      createdAt: new Date(),
    };

    it('should successfully create a new user', async () => {
      (
        mockDb
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, createUserDto.email),
              eq(users.username, createUserDto.username),
            ),
          ).limit as jest.Mock
      ).mockResolvedValueOnce([]);
      mockHashPassword.mockResolvedValueOnce(hashedPassword);
      (
        mockDb.insert(users).values(expect.any(Object)).returning as jest.Mock
      ).mockResolvedValueOnce([newUserResult]);

      const result = await service.createUser(createUserDto);

      expect(mockDb.select().from).toHaveBeenCalledWith(users);
      expect(mockDb.select().from(users).where).toHaveBeenCalledWith(
        or(
          eq(users.email, createUserDto.email),
          eq(users.username, createUserDto.username),
        ),
      );
      expect(mockHashPassword).toHaveBeenCalledWith(originalPassword);
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockDb.insert(users).values).toHaveBeenCalledWith({
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        birthday: createUserDto.birthday.toISOString(),
      });
      expect(
        mockDb.insert(users).values(expect.any(Object)).returning,
      ).toHaveBeenCalled();
      expect(result).toEqual(newUserResult);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      const existingUser = { ...newUserResult, username: 'anotheruser' };
      (
        mockDb
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, createUserDto.email),
              eq(users.username, createUserDto.username),
            ),
          ).limit as jest.Mock
      ).mockResolvedValueOnce([existingUser]);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new ConflictException(`User with this email already exists`),
      );
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if user with username already exists', async () => {
      const existingUser = { ...newUserResult, email: 'another@example.com' };
      (
        mockDb
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, createUserDto.email),
              eq(users.username, createUserDto.username),
            ),
          ).limit as jest.Mock
      ).mockResolvedValueOnce([existingUser]);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new ConflictException(`User with this username already exists`),
      );
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should re-throw database errors during user creation', async () => {
      const dbError = new Error('Database connection failed');
      (
        mockDb
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, createUserDto.email),
              eq(users.username, createUserDto.username),
            ),
          ).limit as jest.Mock
      ).mockResolvedValueOnce([]);
      mockHashPassword.mockResolvedValueOnce(hashedPassword);
      (
        mockDb.insert(users).values(expect.any(Object)).returning as jest.Mock
      ).mockImplementationOnce(() => {
        throw dbError;
      });

      await expect(service.createUser(createUserDto)).rejects.toThrow(dbError);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error creating user: Database connection failed',
        ),
      );
    });
  });

  describe('findOne', () => {
    const mockUser: User = {
      id: 1,
      email: 'find@example.com',
      username: 'finduser',
      password: 'hashedpassword',
      fullName: 'Find User',
      birthday: '1990-01-01T00:00:00.000Z',
      createdAt: new Date(),
    };

    it('should return a user if found by query and cache it', async () => {
      (
        mockDb
          .select()
          .from(users)
          .where(and(eq(users.email, mockUser.email))).limit as jest.Mock
      ).mockResolvedValueOnce([mockUser]);

      const result = await service.findOne({ email: mockUser.email });

      expect(mockDb.select().from).toHaveBeenCalledWith(users);
      expect(mockDb.select().from(users).where).toHaveBeenCalledWith(
        and(eq(users.email, mockUser.email)),
      );
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `user:${mockUser.id}`,
        JSON.stringify(mockUser),
        'EX',
        60 * 10,
      );
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if no user is found by query', async () => {
      (
        mockDb
          .select()
          .from(users)
          .where(and(eq(users.email, 'nonexistent@example.com')))
          .limit as jest.Mock
      ).mockResolvedValueOnce([]);

      const result = await service.findOne({
        email: 'nonexistent@example.com',
      });

      expect(mockDb.select().from).toHaveBeenCalledWith(users);
      expect(mockDb.select().from(users).where).toHaveBeenCalledWith(
        and(eq(users.email, 'nonexistent@example.com')),
      );
      expect(mockRedisClient.set).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should handle multiple query conditions correctly', async () => {
      (
        mockDb
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, mockUser.email),
              eq(users.username, mockUser.username),
            ),
          ).limit as jest.Mock
      ).mockResolvedValueOnce([mockUser]);

      const result = await service.findOne({
        email: mockUser.email,
        username: mockUser.username,
      });

      expect(mockDb.select().from(users).where).toHaveBeenCalledWith(
        and(
          eq(users.email, mockUser.email),
          eq(users.username, mockUser.username),
        ),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneById', () => {
    const mockUser: User = {
      id: 2,
      email: 'findbyid@example.com',
      username: 'findbyiduser',
      password: 'hashedpassword',
      fullName: 'User',
      birthday: '1990-01-01T00:00:00.000Z',
      createdAt: new Date('2025-07-26T08:45:12.661Z'),
    };
    const cacheKey = `user:${mockUser.id}`;

    it('should return a user from cache if available', async () => {
      const cachedUser = {
        ...mockUser,
        createdAt: mockUser.createdAt.toISOString(),
      };

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(cachedUser));

      const result = await service.findOneById(mockUser.id);

      expect(mockRedisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(mockDb.select).not.toHaveBeenCalled();
      expect(result).toEqual({
        ...cachedUser,
        createdAt: new Date(cachedUser.createdAt).toISOString(),
      });
    });

    it('should fetch user from DB if not in cache and then cache it', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      (
        mockDb
          .select()
          .from(users)
          .where(and(eq(users.id, mockUser.id))).limit as jest.Mock
      ).mockResolvedValueOnce([mockUser]);

      const result = await service.findOneById(mockUser.id);

      expect(mockRedisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(mockDb.select().from).toHaveBeenCalledWith(users);
      expect(mockDb.select().from(users).where).toHaveBeenCalledWith(
        and(eq(users.id, mockUser.id)),
      );
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(mockUser),
        'EX',
        60 * 10,
      );
      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user not found in DB and not in cache', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      (
        mockDb
          .select()
          .from(users)
          .where(and(eq(users.id, 999))).limit as jest.Mock
      ).mockResolvedValueOnce([]);

      const result = await service.findOneById(999);

      expect(mockRedisClient.get).toHaveBeenCalledWith(`user:999`);
      expect(mockDb.select().from).toHaveBeenCalledWith(users);
      expect(mockDb.select().from(users).where).toHaveBeenCalledWith(
        and(eq(users.id, 999)),
      );
      expect(mockRedisClient.set).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
