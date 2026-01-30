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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
  ProductResponseDto,
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponseDto,
} from './dto';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';
import { PaginatedResult } from '../../common/interfaces';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';
import { BulkOperationDto, BulkOperationResultDto } from '../users/dto';

@ApiTags('Admin - Products')
@ApiBearerAuth('JWT-auth')
@Controller('admin/products')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Slug or SKU already exists' })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ApiResponseDto<ProductResponseDto>> {
    const product = await this.productsService.create(createProductDto);
    return ApiResponseDto.success(
      ProductResponseDto.fromEntity(product),
      'Product created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async findAll(
    @Query() query: QueryProductDto,
  ): Promise<ApiResponseDto<PaginatedResult<ProductResponseDto>>> {
    const result = await this.productsService.findAll(query);
    return ApiResponseDto.success(result, 'Products retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<
    ApiResponseDto<{
      totalProducts: number;
      activeProducts: number;
      draftProducts: number;
      outOfStockProducts: number;
      lowStockProducts: number;
    }>
  > {
    const stats = await this.productsService.getStats();
    return ApiResponseDto.success(stats, 'Statistics retrieved successfully');
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete products (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete completed',
    type: BulkOperationResultDto,
  })
  async bulkDelete(
    @Body() bulkOperationDto: BulkOperationDto,
  ): Promise<ApiResponseDto<BulkOperationResultDto>> {
    const result = await this.productsService.bulkDelete(bulkOperationDto.ids);
    return ApiResponseDto.success(result, 'Bulk delete completed');
  }

  @Post('bulk/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk restore deleted products' })
  @ApiResponse({
    status: 200,
    description: 'Bulk restore completed',
    type: BulkOperationResultDto,
  })
  async bulkRestore(
    @Body() bulkOperationDto: BulkOperationDto,
  ): Promise<ApiResponseDto<BulkOperationResultDto>> {
    const result = await this.productsService.bulkRestore(bulkOperationDto.ids);
    return ApiResponseDto.success(result, 'Bulk restore completed');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<ProductResponseDto>> {
    const product = await this.productsService.findOne(id);
    return ApiResponseDto.success(
      ProductResponseDto.fromEntity(product),
      'Product retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Slug or SKU already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ApiResponseDto<ProductResponseDto>> {
    const product = await this.productsService.update(id, updateProductDto);
    return ApiResponseDto.success(
      ProductResponseDto.fromEntity(product),
      'Product updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.productsService.remove(id);
    return ApiResponseDto.success(null, 'Product deleted successfully');
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Product restored successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Product is not deleted' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<ProductResponseDto>> {
    const product = await this.productsService.restore(id);
    return ApiResponseDto.success(
      ProductResponseDto.fromEntity(product),
      'Product restored successfully',
    );
  }

  // Variant endpoints
  @Post(':id/variants')
  @ApiOperation({ summary: 'Add a variant to a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Product ID' })
  @ApiResponse({
    status: 201,
    description: 'Variant created successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Variant SKU already exists' })
  async addVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createVariantDto: CreateVariantDto,
  ): Promise<ApiResponseDto<VariantResponseDto>> {
    const variant = await this.productsService.addVariant(id, createVariantDto);
    return ApiResponseDto.success(
      VariantResponseDto.fromEntity(variant),
      'Variant created successfully',
    );
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'Get all variants of a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Variants retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getVariants(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<VariantResponseDto[]>> {
    const variants = await this.productsService.getVariants(id);
    return ApiResponseDto.success(variants, 'Variants retrieved successfully');
  }

  @Patch(':id/variants/:variantId')
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Product ID' })
  @ApiParam({
    name: 'variantId',
    type: 'string',
    format: 'uuid',
    description: 'Variant ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Variant updated successfully',
    type: VariantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product or variant not found' })
  @ApiResponse({ status: 409, description: 'Variant SKU already exists' })
  async updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ): Promise<ApiResponseDto<VariantResponseDto>> {
    const variant = await this.productsService.updateVariant(
      id,
      variantId,
      updateVariantDto,
    );
    return ApiResponseDto.success(
      VariantResponseDto.fromEntity(variant),
      'Variant updated successfully',
    );
  }

  @Delete(':id/variants/:variantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product variant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Product ID' })
  @ApiParam({
    name: 'variantId',
    type: 'string',
    format: 'uuid',
    description: 'Variant ID',
  })
  @ApiResponse({ status: 200, description: 'Variant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product or variant not found' })
  async removeVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.productsService.removeVariant(id, variantId);
    return ApiResponseDto.success(null, 'Variant deleted successfully');
  }
}
