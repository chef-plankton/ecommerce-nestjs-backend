import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteMediaDto {
  @ApiProperty({
    description: 'Array of media IDs to delete',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class BulkDeleteResultDto {
  @ApiProperty({ description: 'Number of successfully deleted items' })
  success: number;

  @ApiProperty({ description: 'Number of failed deletions' })
  failed: number;

  @ApiProperty({ description: 'IDs that failed to delete', type: [String] })
  failedIds: string[];
}
