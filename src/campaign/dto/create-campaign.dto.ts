import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCampaignDto {
  @ApiProperty({
    example: 'Summer Sale 2024',
    description: 'Campaign title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Amazing summer sale with 50% off on all products',
    description: 'Detailed campaign description',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Media files (images/videos) - at least one required',
    required: true,
  })
  mediaFiles?: Express.Multer.File[];

  @ApiProperty({
    type: 'string',
    description: 'Geographical targeting for campaign (JSON string)',
    example:
      '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  targetedLocation: string | object;

  @ApiPropertyOptional({
    example: 18,
    description: 'Minimum target age',
    minimum: 13,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMin?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Maximum target age',
    minimum: 13,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMax?: number;

  @ApiProperty({
    example: 10000,
    description: 'Campaign budget in INR',
    minimum: 100,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(100)
  budget: number;

  @ApiProperty({
    example: '2024-12-20T00:00:00Z',
    description: 'Campaign start date and time',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59Z',
    description: 'Campaign end date and time',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
