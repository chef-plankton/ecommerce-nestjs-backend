import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Role, Permission } from '../../../database/entities';

@Exclude()
export class PermissionResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiProperty()
  module: string;

  @Expose()
  @ApiProperty()
  action: string;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }

  static fromEntity(permission: Permission): PermissionResponseDto {
    return new PermissionResponseDto(permission);
  }
}

@Exclude()
export class RoleResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiPropertyOptional()
  description?: string;

  @Expose()
  @ApiProperty()
  isActive: boolean;

  @Expose()
  @ApiProperty()
  isSystem: boolean;

  @Expose()
  @Type(() => PermissionResponseDto)
  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
    if (partial?.permissions) {
      this.permissions = partial.permissions.map(
        (p) => new PermissionResponseDto(p),
      );
    }
  }

  static fromEntity(role: Role): RoleResponseDto {
    return new RoleResponseDto(role);
  }

  static fromEntities(roles: Role[]): RoleResponseDto[] {
    return roles.map((role) => RoleResponseDto.fromEntity(role));
  }
}
