import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../database/entities';

class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  permissions: string[];
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  static fromUser(
    user: User,
    accessToken: string,
    refreshToken: string,
  ): AuthResponseDto {
    const response = new AuthResponseDto();
    response.accessToken = accessToken;
    response.refreshToken = refreshToken;
    response.user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role?.name || '',
      permissions:
        user.role?.permissions?.map((p) => p.name) || [],
    };
    return response;
  }
}
