import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale 2024', description: 'Campaign title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Amazing summer sale with 50% off on all products' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Media files (images/videos)',
  })
  mediaFiles?: Express.Multer.File[];

  // KEEPING THE ORIGINAL FIELD - Frontend still sends this
  @ApiProperty({
    type: 'string',
    description: 'Geographical targeting (JSON string)',
    example: '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}',
    required: true,
  })
  @IsNotEmpty()
  @IsString() // Accept as string from frontend (common pattern)
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsObject()
  targetedLocation: {
    country?: string;
    state?: string;
    city?: string;
    radius?: number;
    address?: string; // Optional full address
  };

  // Optional: Allow direct coordinates override (advanced)
  @ApiPropertyOptional({ example: 19.076, description: 'Override latitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetLatitude?: number;

  @ApiPropertyOptional({ example: 72.8777, description: 'Override longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetLongitude?: number;

  @ApiPropertyOptional({ example: 18, minimum: 13, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMin?: number;

  @ApiPropertyOptional({ example: 45, minimum: 13, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMax?: number;

  @ApiProperty({ example: 10000, minimum: 100 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  budget: number;

  @ApiProperty({ example: '2025-12-25T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-15T23:59:59Z' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}