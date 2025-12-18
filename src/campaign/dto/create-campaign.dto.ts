import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TargetedLocationDto {
  @ApiPropertyOptional({ 
    description: 'Target country',
    example: 'Bangladesh'
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ 
    description: 'Target state or division',
    example: 'Dhaka Division'
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ 
    description: 'Target city',
    example: 'Dhaka'
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ 
    description: 'Radius in kilometers from the target location',
    example: 10,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  radius?: number;
}

export class CreateCampaignDto {
  @ApiProperty({ 
    description: 'Campaign title',
    example: 'Summer Sale 2025',
    minLength: 3,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Detailed campaign description',
    example: 'Get up to 50% off on all summer collections. Limited time offer!',
    minLength: 10,
    maxLength: 1000
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ 
    description: 'Media files for the campaign (images/videos)',
    type: 'array',
    items: { type: 'string', format: 'binary' },
    maxItems: 10
  })
  @IsNotEmpty()
  @IsArray()
  mediaFiles: Express.Multer.File[];

  @ApiProperty({ 
    description: 'Geographic targeting for the campaign',
    type: TargetedLocationDto
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TargetedLocationDto)
  targetedLocation: TargetedLocationDto;

  @ApiPropertyOptional({ 
    description: 'Minimum age of target audience',
    example: 18,
    minimum: 13,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMin?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum age of target audience',
    example: 45,
    minimum: 13,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMax?: number;

  @ApiProperty({ 
    description: 'Campaign budget in INR',
    example: 5000,
    minimum: 100
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  budget: number;

  @ApiProperty({ 
    description: 'Campaign start date and time',
    example: '2025-01-01T00:00:00Z',
    type: String,
    format: 'date-time'
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    description: 'Campaign end date and time',
    example: '2025-01-31T23:59:59Z',
    type: String,
    format: 'date-time'
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}