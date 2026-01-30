import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { Media } from '../../database/entities/media.entity';
import { MediaType, SortOrder } from '../../common/enums';
import { PaginatedResult } from '../../common/interfaces';
import { paginate } from '../../common/utils/pagination.util';
import {
  QueryMediaDto,
  MediaResponseDto,
  UploadMediaDto,
  UpdateMediaDto,
  BulkDeleteResultDto,
} from './dto';

@Injectable()
export class MediaService {
  private readonly uploadDestination: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDestination =
      this.configService.get<string>('UPLOAD_DESTINATION') || './uploads';
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories(): void {
    const directories = Object.values(MediaType);
    directories.forEach((dir) => {
      const fullPath = path.join(this.uploadDestination, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private getTypeDirectory(type: MediaType): string {
    switch (type) {
      case MediaType.AVATAR:
        return 'avatars';
      case MediaType.PRODUCT:
        return 'products';
      case MediaType.CATEGORY:
        return 'categories';
      case MediaType.GENERAL:
      default:
        return 'general';
    }
  }

  async findAll(query: QueryMediaDto): Promise<PaginatedResult<MediaResponseDto>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = SortOrder.DESC,
      search,
      type,
      includeDeleted,
      onlyDeleted,
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    // Handle soft delete filtering
    if (onlyDeleted) {
      queryBuilder.withDeleted().andWhere('media.deletedAt IS NOT NULL');
    } else if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(media.originalName ILIKE :search OR media.alt ILIKE :search OR media.title ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Type filter
    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'originalName', 'size', 'type'];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`media.${actualSortBy}`, sortOrder);

    // Pagination
    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return paginate(MediaResponseDto.fromEntities(data), total, page, limit);
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  async upload(
    file: Express.Multer.File,
    uploadMediaDto: UploadMediaDto,
  ): Promise<Media> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { type, alt, title } = uploadMediaDto;
    const typeDir = this.getTypeDirectory(type);
    const uniqueFilename = `${uuidv4()}${extname(file.originalname)}`;
    const relativePath = `${typeDir}/${uniqueFilename}`;
    const fullPath = path.join(this.uploadDestination, relativePath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file to disk
    fs.writeFileSync(fullPath, file.buffer);

    // Create media record in database
    const media = this.mediaRepository.create({
      originalName: file.originalname,
      filename: uniqueFilename,
      path: relativePath,
      url: `/uploads/${relativePath}`,
      size: file.size,
      mimeType: file.mimetype,
      type,
      alt,
      title,
    });

    return this.mediaRepository.save(media);
  }

  async uploadBulk(
    files: Express.Multer.File[],
    type: MediaType,
  ): Promise<Media[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedMedia: Media[] = [];

    for (const file of files) {
      const media = await this.upload(file, { type });
      uploadedMedia.push(media);
    }

    return uploadedMedia;
  }

  async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    const media = await this.findOne(id);
    Object.assign(media, updateMediaDto);
    return this.mediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);

    // Delete file from disk
    this.deleteFileFromDisk(media.path);

    // Hard delete from database (since we're deleting the file)
    await this.mediaRepository.remove(media);
  }

  async softRemove(id: string): Promise<void> {
    const media = await this.findOne(id);
    await this.mediaRepository.softRemove(media);
  }

  async restore(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (!media.deletedAt) {
      throw new BadRequestException('Media is not deleted');
    }

    await this.mediaRepository.restore(id);
    return this.findOne(id);
  }

  async bulkDelete(ids: string[]): Promise<BulkDeleteResultDto> {
    const result: BulkDeleteResultDto = {
      success: 0,
      failed: 0,
      failedIds: [],
    };

    for (const id of ids) {
      try {
        await this.remove(id);
        result.success++;
      } catch {
        result.failed++;
        result.failedIds.push(id);
      }
    }

    return result;
  }

  async bulkSoftDelete(ids: string[]): Promise<BulkDeleteResultDto> {
    const result: BulkDeleteResultDto = {
      success: 0,
      failed: 0,
      failedIds: [],
    };

    for (const id of ids) {
      try {
        await this.softRemove(id);
        result.success++;
      } catch {
        result.failed++;
        result.failedIds.push(id);
      }
    }

    return result;
  }

  async getStats(): Promise<{
    totalMedia: number;
    byType: Record<MediaType, number>;
    totalSize: number;
  }> {
    const totalMedia = await this.mediaRepository.count();

    const byTypeResult = await this.mediaRepository
      .createQueryBuilder('media')
      .select('media.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('media.type')
      .getRawMany();

    const byType = {} as Record<MediaType, number>;
    Object.values(MediaType).forEach((type) => {
      byType[type] = 0;
    });
    byTypeResult.forEach((item) => {
      byType[item.type as MediaType] = parseInt(item.count, 10);
    });

    const totalSizeResult = await this.mediaRepository
      .createQueryBuilder('media')
      .select('SUM(media.size)', 'totalSize')
      .getRawOne();

    return {
      totalMedia,
      byType,
      totalSize: parseInt(totalSizeResult?.totalSize || '0', 10),
    };
  }

  private deleteFileFromDisk(filePath: string): boolean {
    try {
      const fullPath = path.join(this.uploadDestination, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getUploadDestination(): string {
    return this.uploadDestination;
  }
}
