import { IsEnum, IsOptional, IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateCampaignDto {
  @ApiPropertyOptional({ 
    example: 'Updated Campaign Title',
    description: 'Campaign title'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ 
    example: 'Updated campaign description',
    description: 'Detailed campaign description'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    type: 'string',
    description: 'Geographical targeting for campaign (JSON string)',
    example: '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}'
  })
  @IsOptional()
  targetedLocation?: string | object;

  @ApiPropertyOptional({ 
    example: 20,
    description: 'Minimum target age',
    minimum: 13,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMin?: number;

  @ApiPropertyOptional({ 
    example: 50,
    description: 'Maximum target age',
    minimum: 13,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMax?: number;

  @ApiPropertyOptional({ 
    example: 15000,
    description: 'Campaign budget in INR',
    minimum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  @IsNumber()
  @Min(100)
  budget?: number;

  @ApiPropertyOptional({ 
    example: '2024-12-25T00:00:00Z',
    description: 'Campaign start date and time'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    example: '2025-01-15T23:59:59Z',
    description: 'Campaign end date and time'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    enum: ['RUNNING', 'PAUSED', 'COMPLETED'],
    description: 'Campaign status',
    example: 'PAUSED'
  })
  @IsOptional()
  @IsEnum(['RUNNING', 'PAUSED', 'COMPLETED'])
  status?: string;

  @ApiPropertyOptional({ 
    type: 'array', 
    items: { type: 'string', format: 'binary' },
    description: 'Replace media files (optional)',
  })
  mediaFiles?: Express.Multer.File[];
}