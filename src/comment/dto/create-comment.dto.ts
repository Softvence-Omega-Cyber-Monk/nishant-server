import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'This campaign looks great!',
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    example: 'parent-comment-uuid',
    description: 'Parent comment ID (only for replies)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
