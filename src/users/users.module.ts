import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from './auth/auth.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [UsersService, AuthService],
  controllers: [UsersController],
})
export class UsersModule {}
