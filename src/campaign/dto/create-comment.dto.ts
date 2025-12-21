import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Great campaign! Looking forward to it.',
    description: 'Comment text content',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    example: 'uuid-of-parent-comment',
    description: 'Parent comment ID for replies',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
