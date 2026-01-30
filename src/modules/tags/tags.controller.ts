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
import { TagsService } from './tags.service';
import {
  CreateTagDto,
  UpdateTagDto,
  QueryTagDto,
  TagResponseDto,
  SimpleTagDto,
  AssignTagsDto,
} from './dto';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';
import { PaginatedResult } from '../../common/interfaces';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';
import { BulkOperationDto, BulkOperationResultDto } from '../users/dto';

@ApiTags('Admin - Tags')
@ApiBearerAuth('JWT-auth')
@Controller('admin/tags')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Tag name or slug already exists' })
  async create(
    @Body() createTagDto: CreateTagDto,
  ): Promise<ApiResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.create(createTagDto);
    return ApiResponseDto.success(
      TagResponseDto.fromEntity(tag),
      'Tag created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
  })
  async findAll(
    @Query() query: QueryTagDto,
  ): Promise<ApiResponseDto<PaginatedResult<TagResponseDto>>> {
    const result = await this.tagsService.findAll(query);
    return ApiResponseDto.success(result, 'Tags retrieved successfully');
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get simple tag list for dropdowns' })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
  })
  async getSimple(): Promise<ApiResponseDto<SimpleTagDto[]>> {
    const tags = await this.tagsService.findSimple();
    return ApiResponseDto.success(tags, 'Tags retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get tag statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<
    ApiResponseDto<{
      totalTags: number;
      activeTags: number;
      inactiveTags: number;
      tagsWithProducts: number;
    }>
  > {
    const stats = await this.tagsService.getStats();
    return ApiResponseDto.success(stats, 'Statistics retrieved successfully');
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete tags (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete completed',
    type: BulkOperationResultDto,
  })
  async bulkDelete(
    @Body() bulkOperationDto: BulkOperationDto,
  ): Promise<ApiResponseDto<BulkOperationResultDto>> {
    const result = await this.tagsService.bulkDelete(bulkOperationDto.ids);
    return ApiResponseDto.success(result, 'Bulk delete completed');
  }

  @Post('bulk/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk restore deleted tags' })
  @ApiResponse({
    status: 200,
    description: 'Bulk restore completed',
    type: BulkOperationResultDto,
  })
  async bulkRestore(
    @Body() bulkOperationDto: BulkOperationDto,
  ): Promise<ApiResponseDto<BulkOperationResultDto>> {
    const result = await this.tagsService.bulkRestore(bulkOperationDto.ids);
    return ApiResponseDto.success(result, 'Bulk restore completed');
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all tags assigned to a product' })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Product tags retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductTags(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<ApiResponseDto<SimpleTagDto[]>> {
    const tags = await this.tagsService.getProductTags(productId);
    return ApiResponseDto.success(tags, 'Product tags retrieved successfully');
  }

  @Patch('product/:productId/assign')
  @ApiOperation({ summary: 'Assign tags to a product' })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tags assigned successfully',
  })
  @ApiResponse({ status: 404, description: 'Product or tags not found' })
  async assignTagsToProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() assignTagsDto: AssignTagsDto,
  ): Promise<ApiResponseDto<null>> {
    await this.tagsService.assignTagsToProduct(productId, assignTagsDto.tagIds);
    return ApiResponseDto.success(null, 'Tags assigned successfully');
  }

  @Patch('product/:productId/remove')
  @ApiOperation({ summary: 'Remove tags from a product' })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tags removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async removeTagsFromProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() assignTagsDto: AssignTagsDto,
  ): Promise<ApiResponseDto<null>> {
    await this.tagsService.removeTagsFromProduct(
      productId,
      assignTagsDto.tagIds,
    );
    return ApiResponseDto.success(null, 'Tags removed successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tag retrieved successfully',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.findOne(id);
    return ApiResponseDto.success(
      TagResponseDto.fromEntity(tag),
      'Tag retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 409, description: 'Tag name or slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<ApiResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.update(id, updateTagDto);
    return ApiResponseDto.success(
      TagResponseDto.fromEntity(tag),
      'Tag updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tag (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.tagsService.remove(id);
    return ApiResponseDto.success(null, 'Tag deleted successfully');
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted tag' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tag restored successfully',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 400, description: 'Tag is not deleted' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.restore(id);
    return ApiResponseDto.success(
      TagResponseDto.fromEntity(tag),
      'Tag restored successfully',
    );
  }
}
