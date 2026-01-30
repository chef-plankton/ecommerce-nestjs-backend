import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMediaDto {
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
