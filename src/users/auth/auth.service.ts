import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInDto } from '../dto/sign-in.dto';
import { UsersService } from '../users.service';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../../utils/hashing.utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(signInData: SignInDto): Promise<string> {
    const user = await this.usersService.findOne({
      username: signInData.username,
    });
    if (!user) {
      throw new BadRequestException("User with given username doesn't exist");
    }

    if (!(await verifyPassword(user.password, signInData.password))) {
      throw new UnauthorizedException('Password is invalid');
    }
    const payload = { sub: user.id, username: user.username };

    return await this.jwtService.signAsync(payload);
  }
}
