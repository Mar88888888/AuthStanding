import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, JwtPayload } from '../../src/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as any;
    guard = new AuthGuard(jwtService);
  });

  function createMockExecutionContext(authHeader?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: authHeader,
          },
        }),
      }),
    } as any;
  }

  it('should throw UnauthorizedException if no token', async () => {
    const context = createMockExecutionContext(undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token is invalid', async () => {
    const context = createMockExecutionContext('Bearer invalid.token.here');
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('Invalid token'),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should attach payload to request and return true if token is valid', async () => {
    const mockPayload: JwtPayload = {
      sub: 1,
      username: 'user',
      iat: 123456,
      eat: 123456 + 3600,
    };
    const request = {
      headers: { authorization: 'Bearer valid.token.here' },
    } as any;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);

    const canActivate = await guard.canActivate(context);

    expect(canActivate).toBe(true);
    expect(request.user).toEqual(mockPayload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.token.here', {
      secret: process.env.JWT_SECRET,
    });
  });

  it('should throw UnauthorizedException if authorization header type is not Bearer', async () => {
    const context = createMockExecutionContext('Basic sometoken');
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
