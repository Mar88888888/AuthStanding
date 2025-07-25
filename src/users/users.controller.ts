import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(public usersService: UsersService) {}

  @Post('/signup')
  async createUser(@Body() userData: CreateUserDto): Promise<void> {
    await this.usersService.createUser(userData);
  }
}
