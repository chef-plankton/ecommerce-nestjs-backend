import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tag } from '../../../database/entities/tag.entity';

export class TagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  @ApiPropertyOptional()
  productCount?: number;

  static fromEntity(entity: Tag): TagResponseDto {
    const dto = new TagResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    dto.description = entity.description;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.deletedAt = entity.deletedAt;
    dto.productCount = entity.products?.length;
    return dto;
  }

  static fromEntities(entities: Tag[]): TagResponseDto[] {
    return entities.map((entity) => TagResponseDto.fromEntity(entity));
  }
}

export class SimpleTagDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  static fromEntity(entity: Tag): SimpleTagDto {
    const dto = new SimpleTagDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    return dto;
  }

  static fromEntities(entities: Tag[]): SimpleTagDto[] {
    return entities.map((entity) => SimpleTagDto.fromEntity(entity));
  }
}
