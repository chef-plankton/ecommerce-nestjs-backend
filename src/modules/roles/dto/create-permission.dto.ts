import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users.create', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Create Users', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Allows creating new users' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'users', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  module: string;

  @ApiProperty({ example: 'create', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  action: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'users.create', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Create Users', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Allows creating new users' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'users', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;

  @ApiPropertyOptional({ example: 'create', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
