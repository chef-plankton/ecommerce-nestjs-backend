import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationDto {
  @ApiProperty({
    description: 'Array of user IDs to perform operation on',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class BulkOperationResultDto {
  @ApiProperty({ description: 'Number of successfully processed items' })
  success: number;

  @ApiProperty({ description: 'Number of failed items' })
  failed: number;

  @ApiProperty({ description: 'IDs that failed to process', type: [String] })
  failedIds: string[];
}
