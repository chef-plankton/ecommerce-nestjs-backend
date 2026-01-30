import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { PaginatedResult } from '../../common/interfaces';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
  CategoryResponseDto,
  SimpleCategoryDto,
} from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { slug, parentId, ...rest } = createCategoryDto;

    // Check if slug already exists
    const existingSlug = await this.categoryRepository.findOne({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Category with this slug already exists');
    }

    // Validate parent category if provided
    if (parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = this.categoryRepository.create({
      ...rest,
      slug,
      parentId,
    });

    return this.categoryRepository.save(category);
  }

  async findAll(
    query: QueryCategoryDto,
  ): Promise<PaginatedResult<CategoryResponseDto>> {
    const {
      page,
      limit,
      sortBy = 'sortOrder',
      sortOrder,
      search,
      isActive,
      parentId,
      rootOnly,
      includeDeleted,
      onlyDeleted,
    } = query;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.slug ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    // Parent filter
    if (parentId) {
      queryBuilder.andWhere('category.parentId = :parentId', { parentId });
    }

    // Root only filter
    if (rootOnly) {
      queryBuilder.andWhere('category.parentId IS NULL');
    }

    // Soft delete filter
    if (onlyDeleted) {
      queryBuilder.withDeleted().andWhere('category.deletedAt IS NOT NULL');
    } else if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('category.deletedAt IS NULL');
    }

    // Sorting
    const validSortFields = ['sortOrder', 'name', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'sortOrder';
    queryBuilder.orderBy(`category.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Pagination
    const categories = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: CategoryResponseDto.fromEntities(categories),
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

  async findTree(): Promise<CategoryResponseDto[]> {
    // Get all root categories with their children
    const rootCategories = await this.categoryRepository.find({
      where: { parentId: IsNull(), isActive: true },
      relations: ['children', 'children.children'],
      order: { sortOrder: 'ASC' },
    });

    return CategoryResponseDto.fromEntities(rootCategories);
  }

  async findSimple(): Promise<SimpleCategoryDto[]> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return SimpleCategoryDto.fromEntities(categories);
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    const { slug, parentId, ...rest } = updateCategoryDto;

    // Check if slug is being changed and already exists
    if (slug && slug !== category.slug) {
      const existingSlug = await this.categoryRepository.findOne({
        where: { slug },
      });
      if (existingSlug) {
        throw new ConflictException('Category with this slug already exists');
      }
      category.slug = slug;
    }

    // Validate parent category if being changed
    if (parentId !== undefined && parentId !== category.parentId) {
      if (parentId) {
        // Prevent setting itself as parent
        if (parentId === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }

        const parent = await this.categoryRepository.findOne({
          where: { id: parentId },
        });
        if (!parent) {
          throw new BadRequestException('Parent category not found');
        }

        // Prevent circular reference
        const isChild = await this.isDescendant(parentId, id);
        if (isChild) {
          throw new BadRequestException(
            'Cannot set a child category as parent (circular reference)',
          );
        }
      }
      category.parentId = parentId || undefined;
    }

    Object.assign(category, rest);

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.softRemove(category);
  }

  async restore(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.deletedAt) {
      throw new BadRequestException('Category is not deleted');
    }

    await this.categoryRepository.restore(id);
    return this.findOne(id);
  }

  async count(): Promise<number> {
    return this.categoryRepository.count();
  }

  private async isDescendant(
    potentialParentId: string,
    categoryId: string,
  ): Promise<boolean> {
    const children = await this.categoryRepository.find({
      where: { parentId: categoryId },
    });

    for (const child of children) {
      if (child.id === potentialParentId) {
        return true;
      }
      const isChildDescendant = await this.isDescendant(potentialParentId, child.id);
      if (isChildDescendant) {
        return true;
      }
    }

    return false;
  }
}
