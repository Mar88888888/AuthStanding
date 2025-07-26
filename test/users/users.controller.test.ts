import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { AuthService } from '../../src/users/auth/auth.service';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { UserResponseDto } from '../../src/users/dto/user-response.dto';
import { SignInDto } from '../../src/users/dto/sign-in.dto';
import { User } from '../../src/users/user.type';
import { AuthGuard } from '../../src/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let authService: jest.Mocked<AuthService>;

  function createMockUser(overrides?: Partial<User>): User {
    return {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      fullName: 'Test User',
      birthday: '1990-01-01T00:00:00.000Z',
      createdAt: new Date('01-01-2025'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            findOneById: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
          },
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
    authService = module.get(AuthService);
  });

  describe('signUp', () => {
    it('should create and return a user', async () => {
      const dto: CreateUserDto = {
        username: 'john',
        password: 'pass',
        email: 'john@example.com',
        fullName: 'John Doe',
        birthday: new Date('1995-01-01T00:00:00.000Z'),
      };

      const userData: User = {
        ...dto,
        id: 1,
        createdAt: new Date('01-01-2025'),
        birthday: dto.birthday.toISOString(),
      };

      const mockUser = createMockUser(userData);

      usersService.createUser.mockResolvedValue(mockUser);

      const result = await controller.signUp(dto);

      expect(usersService.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(UserResponseDto.fromEntity(mockUser));
    });
  });

  describe('signIn', () => {
    it('should sign in and return a token', async () => {
      const dto: SignInDto = { username: 'john', password: 'pass' };
      const token = 'jwt.token';
      authService.signIn.mockResolvedValue(token);

      const result = await controller.signIn(dto);

      expect(authService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toBe(token);
    });
  });

  describe('getUserByToken', () => {
    it('should return user profile for valid token', async () => {
      const mockUser = createMockUser({ id: 1, username: 'john' });
      const req = { user: { sub: 1 } } as any;

      usersService.findOneById.mockResolvedValue(mockUser);

      const result = await controller.getUserByToken(req);

      expect(usersService.findOneById).toHaveBeenCalledWith(1);
      expect(result).toEqual(UserResponseDto.fromEntity(mockUser));
    });

    it('should throw NotFoundException if user not found', async () => {
      const req = { user: { sub: 99 } } as any;
      usersService.findOneById.mockResolvedValue(undefined);

      await expect(controller.getUserByToken(req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
