import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import {
  QueryMediaDto,
  MediaResponseDto,
  UploadMediaDto,
  UpdateMediaDto,
  BulkDeleteMediaDto,
  BulkDeleteResultDto,
} from './dto';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';
import { PaginatedResult } from '../../common/interfaces';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole, MediaType } from '../../common/enums';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_COUNT = 10;

const multerOptions = {
  storage: memoryStorage(),
  fileFilter: (
    req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};

@ApiTags('Admin - Media')
@ApiBearerAuth('JWT-auth')
@Controller('admin/media')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'List all media with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Media list retrieved successfully',
  })
  async findAll(
    @Query() query: QueryMediaDto,
  ): Promise<ApiResponseDto<PaginatedResult<MediaResponseDto>>> {
    const result = await this.mediaService.findAll(query);
    return ApiResponseDto.success(result, 'Media retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get media statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<
    ApiResponseDto<{
      totalMedia: number;
      byType: Record<MediaType, number>;
      totalSize: number;
    }>
  > {
    const stats = await this.mediaService.getStats();
    return ApiResponseDto.success(stats, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single media by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
    type: MediaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<MediaResponseDto>> {
    const media = await this.mediaService.findOne(id);
    return ApiResponseDto.success(
      MediaResponseDto.fromEntity(media),
      'Media retrieved successfully',
    );
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WebP)',
        },
        type: {
          type: 'string',
          enum: Object.values(MediaType),
          description: 'Media type/category',
        },
        alt: {
          type: 'string',
          description: 'Alt text for accessibility',
        },
        title: {
          type: 'string',
          description: 'Title/caption for the media',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media uploaded successfully',
    type: MediaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or missing type' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadMediaDto: UploadMediaDto,
  ): Promise<ApiResponseDto<MediaResponseDto>> {
    const media = await this.mediaService.upload(file, uploadMediaDto);
    return ApiResponseDto.success(
      MediaResponseDto.fromEntity(media),
      'Media uploaded successfully',
    );
  }

  @Post('upload/bulk')
  @ApiOperation({ summary: 'Upload multiple media files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files', 'type'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files (max 10 files)',
        },
        type: {
          type: 'string',
          enum: Object.values(MediaType),
          description: 'Media type/category for all files',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media files uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid files or missing type' })
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_COUNT, multerOptions))
  async uploadBulk(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('type') type: MediaType,
  ): Promise<ApiResponseDto<MediaResponseDto[]>> {
    if (!type) {
      throw new BadRequestException('Media type is required');
    }
    const mediaList = await this.mediaService.uploadBulk(files, type);
    return ApiResponseDto.success(
      MediaResponseDto.fromEntities(mediaList),
      'Media files uploaded successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media metadata (alt, title)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Media updated successfully',
    type: MediaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ): Promise<ApiResponseDto<MediaResponseDto>> {
    const media = await this.mediaService.update(id, updateMediaDto);
    return ApiResponseDto.success(
      MediaResponseDto.fromEntity(media),
      'Media updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a media file (permanently)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.mediaService.remove(id);
    return ApiResponseDto.success(null, 'Media deleted successfully');
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete media files (permanently)' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete completed',
    type: BulkDeleteResultDto,
  })
  async bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteMediaDto,
  ): Promise<ApiResponseDto<BulkDeleteResultDto>> {
    const result = await this.mediaService.bulkDelete(bulkDeleteDto.ids);
    return ApiResponseDto.success(result, 'Bulk delete completed');
  }
}
