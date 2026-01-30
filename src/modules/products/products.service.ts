import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { Category } from '../../database/entities/category.entity';
import { PaginatedResult } from '../../common/interfaces';
import { ProductStatus } from '../../common/enums';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  ProductResponseDto,
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponseDto,
} from './dto';
import { BulkOperationResultDto } from '../users/dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { slug, sku, categoryId, variants, ...rest } = createProductDto;

    // Check if slug already exists
    const existingSlug = await this.productRepository.findOne({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Product with this slug already exists');
    }

    // Check if SKU already exists
    const existingSku = await this.productRepository.findOne({
      where: { sku },
    });
    if (existingSku) {
      throw new ConflictException('Product with this SKU already exists');
    }

    // Validate category if provided
    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Create product
    const product = this.productRepository.create({
      ...rest,
      slug,
      sku,
      categoryId,
    });

    // Save product first
    const savedProduct = await this.productRepository.save(product);

    // Create variants if provided
    if (variants && variants.length > 0) {
      await this.createVariants(savedProduct.id, variants);
      savedProduct.hasVariants = true;
      await this.productRepository.save(savedProduct);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(
    query: QueryProductDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder,
      search,
      status,
      categoryId,
      minPrice,
      maxPrice,
      hasVariants,
      inStock,
      lowStock,
      createdAfter,
      createdBefore,
      includeDeleted,
      onlyDeleted,
    } = query;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.slug ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Price range filters
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Has variants filter
    if (hasVariants !== undefined) {
      queryBuilder.andWhere('product.hasVariants = :hasVariants', {
        hasVariants,
      });
    }

    // In-stock filter
    if (inStock === true) {
      queryBuilder.andWhere('product.quantity > 0');
    }

    // Low stock filter
    if (lowStock === true) {
      queryBuilder.andWhere(
        'product.quantity > 0 AND product.quantity <= product.lowStockThreshold',
      );
    }

    // Date range filters
    if (createdAfter) {
      queryBuilder.andWhere('product.createdAt >= :createdAfter', {
        createdAfter: new Date(createdAfter),
      });
    }
    if (createdBefore) {
      queryBuilder.andWhere('product.createdAt <= :createdBefore', {
        createdBefore: new Date(createdBefore),
      });
    }

    // Soft delete filter
    if (onlyDeleted) {
      queryBuilder.withDeleted().andWhere('product.deletedAt IS NOT NULL');
    } else if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('product.deletedAt IS NULL');
    }

    // Sorting
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'name',
      'price',
      'quantity',
      'sku',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Pagination
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: ProductResponseDto.fromEntities(products),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'variants'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    const { slug, sku, categoryId, variants, ...rest } = updateProductDto;

    // Check if slug is being changed and already exists
    if (slug && slug !== product.slug) {
      const existingSlug = await this.productRepository.findOne({
        where: { slug },
      });
      if (existingSlug) {
        throw new ConflictException('Product with this slug already exists');
      }
      product.slug = slug;
    }

    // Check if SKU is being changed and already exists
    if (sku && sku !== product.sku) {
      const existingSku = await this.productRepository.findOne({
        where: { sku },
      });
      if (existingSku) {
        throw new ConflictException('Product with this SKU already exists');
      }
      product.sku = sku;
    }

    // Validate category if being changed
    if (categoryId !== undefined && categoryId !== product.categoryId) {
      if (categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: categoryId },
        });
        if (!category) {
          throw new BadRequestException('Category not found');
        }
      }
      product.categoryId = categoryId || undefined;
    }

    Object.assign(product, rest);

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
  }

  async restore(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.deletedAt) {
      throw new BadRequestException('Product is not deleted');
    }

    await this.productRepository.restore(id);
    return this.findOne(id);
  }

  async bulkDelete(ids: string[]): Promise<BulkOperationResultDto> {
    const result: BulkOperationResultDto = {
      success: 0,
      failed: 0,
      failedIds: [],
    };

    for (const id of ids) {
      try {
        const product = await this.productRepository.findOne({ where: { id } });
        if (product) {
          await this.productRepository.softRemove(product);
          result.success++;
        } else {
          result.failed++;
          result.failedIds.push(id);
        }
      } catch {
        result.failed++;
        result.failedIds.push(id);
      }
    }

    return result;
  }

  async bulkRestore(ids: string[]): Promise<BulkOperationResultDto> {
    const result: BulkOperationResultDto = {
      success: 0,
      failed: 0,
      failedIds: [],
    };

    for (const id of ids) {
      try {
        const product = await this.productRepository.findOne({
          where: { id },
          withDeleted: true,
        });

        if (product && product.deletedAt) {
          await this.productRepository.restore(id);
          result.success++;
        } else {
          result.failed++;
          result.failedIds.push(id);
        }
      } catch {
        result.failed++;
        result.failedIds.push(id);
      }
    }

    return result;
  }

  async count(): Promise<number> {
    return this.productRepository.count();
  }

  async getStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
  }> {
    const totalProducts = await this.productRepository.count();

    const activeProducts = await this.productRepository.count({
      where: { status: ProductStatus.ACTIVE },
    });

    const draftProducts = await this.productRepository.count({
      where: { status: ProductStatus.DRAFT },
    });

    const outOfStockProducts = await this.productRepository.count({
      where: { status: ProductStatus.OUT_OF_STOCK },
    });

    const lowStockProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.quantity > 0')
      .andWhere('product.quantity <= product.lowStockThreshold')
      .andWhere('product.deletedAt IS NULL')
      .getCount();

    return {
      totalProducts,
      activeProducts,
      draftProducts,
      outOfStockProducts,
      lowStockProducts,
    };
  }

  // Variant methods
  async createVariants(
    productId: string,
    variants: CreateVariantDto[],
  ): Promise<ProductVariant[]> {
    const product = await this.findOne(productId);

    const createdVariants: ProductVariant[] = [];

    for (const variantDto of variants) {
      // Check if variant SKU already exists
      const existingSku = await this.variantRepository.findOne({
        where: { sku: variantDto.sku },
      });
      if (existingSku) {
        throw new ConflictException(
          `Variant with SKU "${variantDto.sku}" already exists`,
        );
      }

      const variant = this.variantRepository.create({
        ...variantDto,
        productId: product.id,
      });

      const savedVariant = await this.variantRepository.save(variant);
      createdVariants.push(savedVariant);
    }

    // Update product hasVariants flag
    if (!product.hasVariants && createdVariants.length > 0) {
      product.hasVariants = true;
      await this.productRepository.save(product);
    }

    return createdVariants;
  }

  async addVariant(
    productId: string,
    createVariantDto: CreateVariantDto,
  ): Promise<ProductVariant> {
    const product = await this.findOne(productId);

    // Check if variant SKU already exists
    const existingSku = await this.variantRepository.findOne({
      where: { sku: createVariantDto.sku },
    });
    if (existingSku) {
      throw new ConflictException('Variant with this SKU already exists');
    }

    const variant = this.variantRepository.create({
      ...createVariantDto,
      productId: product.id,
    });

    const savedVariant = await this.variantRepository.save(variant);

    // Update product hasVariants flag
    if (!product.hasVariants) {
      product.hasVariants = true;
      await this.productRepository.save(product);
    }

    return savedVariant;
  }

  async getVariants(productId: string): Promise<VariantResponseDto[]> {
    await this.findOne(productId); // Validate product exists

    const variants = await this.variantRepository.find({
      where: { productId },
      order: { createdAt: 'ASC' },
    });

    return VariantResponseDto.fromEntities(variants);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    updateVariantDto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    await this.findOne(productId); // Validate product exists

    const variant = await this.variantRepository.findOne({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const { sku, ...rest } = updateVariantDto;

    // Check if SKU is being changed and already exists
    if (sku && sku !== variant.sku) {
      const existingSku = await this.variantRepository.findOne({
        where: { sku },
      });
      if (existingSku) {
        throw new ConflictException('Variant with this SKU already exists');
      }
      variant.sku = sku;
    }

    Object.assign(variant, rest);

    return this.variantRepository.save(variant);
  }

  async removeVariant(productId: string, variantId: string): Promise<void> {
    const product = await this.findOne(productId);

    const variant = await this.variantRepository.findOne({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.variantRepository.remove(variant);

    // Check if product still has variants
    const remainingVariants = await this.variantRepository.count({
      where: { productId },
    });

    if (remainingVariants === 0) {
      product.hasVariants = false;
      await this.productRepository.save(product);
    }
  }
}
