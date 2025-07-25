import { User } from '../user.type';

export class UserResponseDto {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly fullName?: string,
    public readonly birthday?: string,
  ) {}

  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto(
      user.id,
      user.username,
      user.email,
      user.createdAt,
      user.fullName || undefined,
      user.birthday || undefined,
    );
  }
}
