import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { User } from './user.type';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    public usersService: UsersService,
    public authService: AuthService,
  ) {}

  @Post('/signup')
  async signUp(@Body() userData: CreateUserDto): Promise<User> {
    return await this.usersService.createUser(userData);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/signin')
  async signIn(@Body() signInData: SignInDto): Promise<string> {
    return await this.authService.signIn(signInData);
  }
}
