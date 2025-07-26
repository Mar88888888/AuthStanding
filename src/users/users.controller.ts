import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from '../guards/auth.guard';
import { AuthorizedRequest } from '../guards/authorized.request.interface';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(
    public usersService: UsersService,
    public authService: AuthService,
  ) {}

  @Post('/signup')
  async signUp(@Body() userData: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.createUser(userData);
    return UserResponseDto.fromEntity(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/signin')
  async signIn(@Body() signInData: SignInDto): Promise<string> {
    return await this.authService.signIn(signInData);
  }

  @UseGuards(AuthGuard)
  @Get('/profile')
  async getUserByToken(
    @Request() req: AuthorizedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOneById(req.user.sub);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return UserResponseDto.fromEntity(user);
  }
}
