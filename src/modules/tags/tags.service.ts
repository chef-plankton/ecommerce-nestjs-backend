import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tag } from '../../database/entities/tag.entity';
import { Product } from '../../database/entities/product.entity';
import { PaginatedResult } from '../../common/interfaces';
import {
  CreateTagDto,
  UpdateTagDto,
  QueryTagDto,
  TagResponseDto,
  SimpleTagDto,
} from './dto';
import { BulkOperationResultDto } from '../users/dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name, slug } = createTagDto;

    // Check if name already exists
    const existingName = await this.tagRepository.findOne({
      where: { name },
    });
    if (existingName) {
      throw new ConflictException('Tag with this name already exists');
    }

    // Check if slug already exists
    const existingSlug = await this.tagRepository.findOne({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Tag with this slug already exists');
    }

    const tag = this.tagRepository.create(createTagDto);
    return this.tagRepository.save(tag);
  }

  async findAll(query: QueryTagDto): Promise<PaginatedResult<TagResponseDto>> {
    const {
      page,
      limit,
      sortBy = 'sortOrder',
      sortOrder,
      search,
      isActive,
      includeDeleted,
      onlyDeleted,
    } = query;

    const queryBuilder = this.tagRepository
      .createQueryBuilder('tag')
      .loadRelationCountAndMap('tag.productCount', 'tag.products');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(tag.name ILIKE :search OR tag.slug ILIKE :search OR tag.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('tag.isActive = :isActive', { isActive });
    }

    // Soft delete filter
    if (onlyDeleted) {
      queryBuilder.withDeleted().andWhere('tag.deletedAt IS NOT NULL');
    } else if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('tag.deletedAt IS NULL');
    }

    // Sorting
    const validSortFields = ['sortOrder', 'name', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'sortOrder';
    queryBuilder.orderBy(`tag.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Pagination
    const tags = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: TagResponseDto.fromEntities(tags),
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

  async findSimple(): Promise<SimpleTagDto[]> {
    const tags = await this.tagRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return SimpleTagDto.fromEntities(tags);
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { slug },
      relations: ['products'],
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    const { name, slug, ...rest } = updateTagDto;

    // Check if name is being changed and already exists
    if (name && name !== tag.name) {
      const existingName = await this.tagRepository.findOne({
        where: { name },
      });
      if (existingName) {
        throw new ConflictException('Tag with this name already exists');
      }
      tag.name = name;
    }

    // Check if slug is being changed and already exists
    if (slug && slug !== tag.slug) {
      const existingSlug = await this.tagRepository.findOne({
        where: { slug },
      });
      if (existingSlug) {
        throw new ConflictException('Tag with this slug already exists');
      }
      tag.slug = slug;
    }

    Object.assign(tag, rest);

    return this.tagRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepository.softRemove(tag);
  }

  async restore(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (!tag.deletedAt) {
      throw new BadRequestException('Tag is not deleted');
    }

    await this.tagRepository.restore(id);
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
        const tag = await this.tagRepository.findOne({ where: { id } });
        if (tag) {
          await this.tagRepository.softRemove(tag);
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
        const tag = await this.tagRepository.findOne({
          where: { id },
          withDeleted: true,
        });

        if (tag && tag.deletedAt) {
          await this.tagRepository.restore(id);
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
    return this.tagRepository.count();
  }

  async getStats(): Promise<{
    totalTags: number;
    activeTags: number;
    inactiveTags: number;
    tagsWithProducts: number;
  }> {
    const totalTags = await this.tagRepository.count();

    const activeTags = await this.tagRepository.count({
      where: { isActive: true },
    });

    const inactiveTags = await this.tagRepository.count({
      where: { isActive: false },
    });

    const tagsWithProducts = await this.tagRepository
      .createQueryBuilder('tag')
      .innerJoin('tag.products', 'product')
      .where('tag.deletedAt IS NULL')
      .getCount();

    return {
      totalTags,
      activeTags,
      inactiveTags,
      tagsWithProducts,
    };
  }

  // Product-Tag operations
  async assignTagsToProduct(
    productId: string,
    tagIds: string[],
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['tags'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const tags = await this.tagRepository.find({
      where: { id: In(tagIds), isActive: true },
    });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('Some tags were not found or are inactive');
    }

    product.tags = tags;
    return this.productRepository.save(product);
  }

  async removeTagsFromProduct(
    productId: string,
    tagIds: string[],
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['tags'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.tags = product.tags.filter((tag) => !tagIds.includes(tag.id));
    return this.productRepository.save(product);
  }

  async getProductTags(productId: string): Promise<SimpleTagDto[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['tags'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return SimpleTagDto.fromEntities(product.tags || []);
  }

  async getTagProducts(tagId: string): Promise<Product[]> {
    const tag = await this.findOne(tagId);
    return tag.products || [];
  }
}
