import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Media } from '../../../database/entities/media.entity';
import { MediaType } from '../../../common/enums';

export class MediaResponseDto {
  @ApiProperty({ description: 'Media ID (UUID)' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Original file name' })
  @Expose()
  originalName: string;

  @ApiProperty({ description: 'Stored file name (UUID-based)' })
  @Expose()
  filename: string;

  @ApiProperty({ description: 'Relative file path' })
  @Expose()
  path: string;

  @ApiProperty({ description: 'Full URL to access the file' })
  @Expose()
  url: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Expose()
  size: number;

  @ApiProperty({ description: 'MIME type of the file' })
  @Expose()
  mimeType: string;

  @ApiProperty({ enum: MediaType, description: 'Media type/category' })
  @Expose()
  type: MediaType;

  @ApiPropertyOptional({ description: 'Alt text for accessibility' })
  @Expose()
  alt?: string;

  @ApiPropertyOptional({ description: 'Title/caption for the media' })
  @Expose()
  title?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Deletion timestamp (if soft-deleted)' })
  @Expose()
  deletedAt?: Date;

  static fromEntity(entity: Media): MediaResponseDto {
    const dto = new MediaResponseDto();
    dto.id = entity.id;
    dto.originalName = entity.originalName;
    dto.filename = entity.filename;
    dto.path = entity.path;
    dto.url = entity.url;
    dto.size = entity.size;
    dto.mimeType = entity.mimeType;
    dto.type = entity.type;
    dto.alt = entity.alt;
    dto.title = entity.title;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.deletedAt = entity.deletedAt;
    return dto;
  }

  static fromEntities(entities: Media[]): MediaResponseDto[] {
    return entities.map((entity) => MediaResponseDto.fromEntity(entity));
  }
}
