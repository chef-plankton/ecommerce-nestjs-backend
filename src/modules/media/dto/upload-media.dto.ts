import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '../../../common/enums';

export class UploadMediaDto {
  @ApiProperty({ enum: MediaType, description: 'Type/category of the media' })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiPropertyOptional({ description: 'Alt text for accessibility', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({ description: 'Title/caption for the media', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;
}
