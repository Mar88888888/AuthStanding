import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  MaxDate,
  MinDate,
  IsDefined,
} from 'class-validator';
import { AuthCredentialsDto } from './auth-credentials.dto';

export class CreateUserDto extends AuthCredentialsDto {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(60, { message: 'Full name is too long (max 60 characters)' })
  fullName: string;

  @IsDefined()
  @Type(() => Date)
  @MinDate(new Date('1909-01-01'), {
    message: "Unless you're a time traveler, you can't be born before 1909",
  })
  @MaxDate(new Date(), { message: 'Birthday cannot be in the future' })
  birthday: Date;
}
