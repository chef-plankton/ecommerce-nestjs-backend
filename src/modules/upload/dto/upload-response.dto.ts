import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'Stored filename' })
  filename: string;

  @ApiProperty({ description: 'File path relative to uploads directory' })
  path: string;

  @ApiProperty({ description: 'Full URL to access the file' })
  url: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'File MIME type' })
  mimeType: string;
}
