import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../../../database/entities/category.entity';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  image?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional()
  parent?: CategoryResponseDto;

  @ApiPropertyOptional({ type: () => [CategoryResponseDto] })
  children?: CategoryResponseDto[];

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

  static fromEntity(entity: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    dto.description = entity.description;
    dto.image = entity.image;
    dto.parentId = entity.parentId;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.deletedAt = entity.deletedAt;

    if (entity.parent) {
      dto.parent = CategoryResponseDto.fromEntity(entity.parent);
    }

    if (entity.children && entity.children.length > 0) {
      dto.children = entity.children.map((child) =>
        CategoryResponseDto.fromEntity(child),
      );
    }

    return dto;
  }

  static fromEntities(entities: Category[]): CategoryResponseDto[] {
    return entities.map((entity) => CategoryResponseDto.fromEntity(entity));
  }
}

export class SimpleCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  parentId?: string;

  static fromEntity(entity: Category): SimpleCategoryDto {
    const dto = new SimpleCategoryDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    dto.parentId = entity.parentId;
    return dto;
  }

  static fromEntities(entities: Category[]): SimpleCategoryDto[] {
    return entities.map((entity) => SimpleCategoryDto.fromEntity(entity));
  }
}
