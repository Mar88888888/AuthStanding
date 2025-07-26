import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/users/auth/auth.service';
import { UsersService } from '../../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as hashingUtils from '../../../src/utils/hashing.utils';
import { SignInDto } from '../../../src/users/dto/sign-in.dto';
import { User } from '../../../src/users/user.type';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    fullName: 'Test User',
    birthday: '1990-01-01T00:00:00.000Z',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should return JWT token if credentials are valid', async () => {
      usersService.findOne.mockResolvedValueOnce(mockUser);
      jest.spyOn(hashingUtils, 'verifyPassword').mockResolvedValueOnce(true);
      jwtService.signAsync.mockResolvedValueOnce('jwt-token');

      const result = await service.signIn(signInDto);

      expect(usersService.findOne).toHaveBeenCalledWith({
        username: signInDto.username,
      });
      expect(hashingUtils.verifyPassword).toHaveBeenCalledWith(
        mockUser.password,
        signInDto.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(result).toBe('jwt-token');
    });

    it('should throw BadRequestException if user not found', async () => {
      usersService.findOne.mockResolvedValueOnce(undefined);

      jest.spyOn(hashingUtils, 'verifyPassword');

      await expect(service.signIn(signInDto)).rejects.toThrow(
        new BadRequestException("User with given username doesn't exist"),
      );

      expect(hashingUtils.verifyPassword).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findOne.mockResolvedValueOnce(mockUser);
      jest.spyOn(hashingUtils, 'verifyPassword').mockResolvedValue(false);

      await expect(service.signIn(signInDto)).rejects.toThrow(
        new UnauthorizedException('Password is invalid'),
      );

      expect(hashingUtils.verifyPassword).toHaveBeenCalledWith(
        mockUser.password,
        signInDto.password,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
