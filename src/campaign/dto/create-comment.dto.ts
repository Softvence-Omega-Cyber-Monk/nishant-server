import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ 
    description: 'Comment content',
    example: 'Great campaign! Very engaging content.',
    minLength: 1,
    maxLength: 500
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ 
    description: 'Parent comment ID for nested replies',
    example: 'comment_123456',
    type: String
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}