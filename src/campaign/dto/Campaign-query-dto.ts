import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CampaignQueryDto {
  @ApiPropertyOptional({
    example: 0,
    description: 'Number of items to skip (for pagination)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of ads to return',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 20;
}
