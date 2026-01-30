import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Gender, UserStatus } from '../../../common/enums';
import { User } from '../../../database/entities';

class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;
}

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  firstName: string;

  @Expose()
  @ApiProperty()
  lastName: string;

  @Expose()
  @ApiProperty()
  fullName: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiPropertyOptional()
  phone?: string;

  @Expose()
  @ApiPropertyOptional()
  avatar?: string;

  @Expose()
  @ApiPropertyOptional()
  birthDate?: Date;

  @Expose()
  @ApiPropertyOptional({ enum: Gender })
  gender?: Gender;

  @Expose()
  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @Expose()
  @ApiProperty()
  emailVerified: boolean;

  @Expose()
  @ApiPropertyOptional()
  emailVerifiedAt?: Date;

  @Expose()
  @ApiProperty()
  phoneVerified: boolean;

  @Expose()
  @ApiPropertyOptional()
  phoneVerifiedAt?: Date;

  @Expose()
  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @Expose()
  @ApiProperty()
  roleId: string;

  @Expose()
  @Type(() => RoleResponseDto)
  @ApiProperty({ type: RoleResponseDto })
  role: RoleResponseDto;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Deletion timestamp (if soft-deleted)' })
  deletedAt?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
    if (partial) {
      this.fullName = `${partial.firstName} ${partial.lastName}`;
    }
  }

  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((user) => UserResponseDto.fromEntity(user));
  }
}
