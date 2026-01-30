import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
  CategoryResponseDto,
  SimpleCategoryDto,
} from './dto';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';
import { PaginatedResult } from '../../common/interfaces';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';

@ApiTags('Admin - Categories')
@ApiBearerAuth('JWT-auth')
@Controller('admin/categories')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.create(createCategoryDto);
    return ApiResponseDto.success(
      CategoryResponseDto.fromEntity(category),
      'Category created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async findAll(
    @Query() query: QueryCategoryDto,
  ): Promise<ApiResponseDto<PaginatedResult<CategoryResponseDto>>> {
    const result = await this.categoriesService.findAll(query);
    return ApiResponseDto.success(result, 'Categories retrieved successfully');
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree structure' })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully',
  })
  async getTree(): Promise<ApiResponseDto<CategoryResponseDto[]>> {
    const tree = await this.categoriesService.findTree();
    return ApiResponseDto.success(tree, 'Category tree retrieved successfully');
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get simple category list for dropdowns' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getSimple(): Promise<ApiResponseDto<SimpleCategoryDto[]>> {
    const categories = await this.categoriesService.findSimple();
    return ApiResponseDto.success(categories, 'Categories retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<ApiResponseDto<{ totalCategories: number }>> {
    const totalCategories = await this.categoriesService.count();
    return ApiResponseDto.success(
      { totalCategories },
      'Statistics retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.findOne(id);
    return ApiResponseDto.success(
      CategoryResponseDto.fromEntity(category),
      'Category retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return ApiResponseDto.success(
      CategoryResponseDto.fromEntity(category),
      'Category updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.categoriesService.remove(id);
    return ApiResponseDto.success(null, 'Category deleted successfully');
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted category' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Category restored successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Category is not deleted' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.restore(id);
    return ApiResponseDto.success(
      CategoryResponseDto.fromEntity(category),
      'Category restored successfully',
    );
  }
}
