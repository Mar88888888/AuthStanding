import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsDefined()
  @IsString()
  @MinLength(4)
  @MaxLength(25)
  username: string;

  @IsDefined()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}
