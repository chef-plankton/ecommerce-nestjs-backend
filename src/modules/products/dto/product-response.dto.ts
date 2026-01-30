import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../../database/entities/product.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { ProductStatus } from '../../../common/enums';

export class VariantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  attributes: Record<string, string>;

  @ApiPropertyOptional()
  image?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: ProductVariant): VariantResponseDto {
    const dto = new VariantResponseDto();
    dto.id = entity.id;
    dto.productId = entity.productId;
    dto.name = entity.name;
    dto.sku = entity.sku;
    dto.price = Number(entity.price);
    dto.quantity = entity.quantity;
    dto.attributes = entity.attributes;
    dto.image = entity.image;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  static fromEntities(entities: ProductVariant[]): VariantResponseDto[] {
    return entities.map((entity) => VariantResponseDto.fromEntity(entity));
  }
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  shortDescription?: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  compareAtPrice?: number;

  @ApiPropertyOptional()
  costPrice?: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  lowStockThreshold: number;

  @ApiPropertyOptional()
  weight?: number;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  category?: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty()
  hasVariants: boolean;

  @ApiPropertyOptional({ type: [VariantResponseDto] })
  variants?: VariantResponseDto[];

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  isInStock: boolean;

  @ApiProperty()
  isLowStock: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;

  static fromEntity(entity: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    dto.description = entity.description;
    dto.shortDescription = entity.shortDescription;
    dto.sku = entity.sku;
    dto.price = Number(entity.price);
    dto.compareAtPrice = entity.compareAtPrice
      ? Number(entity.compareAtPrice)
      : undefined;
    dto.costPrice = entity.costPrice ? Number(entity.costPrice) : undefined;
    dto.quantity = entity.quantity;
    dto.lowStockThreshold = entity.lowStockThreshold;
    dto.weight = entity.weight ? Number(entity.weight) : undefined;
    dto.status = entity.status;
    dto.images = entity.images || [];
    dto.categoryId = entity.categoryId;
    dto.hasVariants = entity.hasVariants;
    dto.metadata = entity.metadata;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.deletedAt = entity.deletedAt;

    // Calculate stock status
    if (entity.hasVariants && entity.variants && entity.variants.length > 0) {
      dto.isInStock = entity.variants.some((v) => v.quantity > 0 && v.isActive);
      dto.isLowStock = entity.variants.some(
        (v) =>
          v.quantity <= entity.lowStockThreshold && v.quantity > 0 && v.isActive,
      );
    } else {
      dto.isInStock = entity.quantity > 0;
      dto.isLowStock =
        entity.quantity <= entity.lowStockThreshold && entity.quantity > 0;
    }

    if (entity.category) {
      dto.category = {
        id: entity.category.id,
        name: entity.category.name,
        slug: entity.category.slug,
      };
    }

    if (entity.variants && entity.variants.length > 0) {
      dto.variants = VariantResponseDto.fromEntities(entity.variants);
    }

    return dto;
  }

  static fromEntities(entities: Product[]): ProductResponseDto[] {
    return entities.map((entity) => ProductResponseDto.fromEntity(entity));
  }
}

export class SimpleProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  status: ProductStatus;

  static fromEntity(entity: Product): SimpleProductDto {
    const dto = new SimpleProductDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    dto.sku = entity.sku;
    dto.price = Number(entity.price);
    dto.status = entity.status;
    return dto;
  }

  static fromEntities(entities: Product[]): SimpleProductDto[] {
    return entities.map((entity) => SimpleProductDto.fromEntity(entity));
  }
}
