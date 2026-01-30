import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { diskStorage, type FileFilterCallback, type DiskStorageOptions } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Request } from 'express';
import { UploadService } from './upload.service';
import { UploadResponseDto } from './dto';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const createMulterOptions = (destination: string) => ({
  storage: diskStorage({
    destination: `./uploads/${destination}`,
    filename: (
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueSuffix = uuidv4();
      const ext = extname(file.originalname);
      callback(null, `${uniqueSuffix}${ext}`);
    },
  } as DiskStorageOptions),
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
        ),
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Avatar uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('avatars')))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponseDto>> {
    const result = this.uploadService.processUploadedFile(file, 'avatars');
    return ApiResponseDto.success(result, 'Avatar uploaded successfully');
  }

  @Post('product')
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product image uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('products')))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponseDto>> {
    const result = this.uploadService.processUploadedFile(file, 'products');
    return ApiResponseDto.success(result, 'Product image uploaded successfully');
  }

  @Post('category')
  @ApiOperation({ summary: 'Upload category image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category image uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('categories')))
  async uploadCategoryImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponseDto>> {
    const result = this.uploadService.processUploadedFile(file, 'categories');
    return ApiResponseDto.success(result, 'Category image uploaded successfully');
  }

  @Post('general')
  @ApiOperation({ summary: 'Upload general file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('general')))
  async uploadGeneral(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponseDto<UploadResponseDto>> {
    const result = this.uploadService.processUploadedFile(file, 'general');
    return ApiResponseDto.success(result, 'File uploaded successfully');
  }

  @Delete(':category/:filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete uploaded file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('category') category: string,
    @Param('filename') filename: string,
  ): Promise<ApiResponseDto<null>> {
    const filePath = `${category}/${filename}`;
    const deleted = this.uploadService.deleteFile(filePath);

    if (!deleted) {
      return ApiResponseDto.success(null, 'File not found or already deleted');
    }

    return ApiResponseDto.success(null, 'File deleted successfully');
  }
}
