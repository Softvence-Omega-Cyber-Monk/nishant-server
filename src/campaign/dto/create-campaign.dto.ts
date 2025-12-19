import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TargetedLocationDto {
  @ApiPropertyOptional({ example: 'India', description: 'Target country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Maharashtra', description: 'Target state/province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Mumbai', description: 'Target city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 50, description: 'Radius in kilometers' })
  @IsOptional()
  @IsNumber()
  radius?: number;
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale 2024', description: 'Campaign title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ 
    example: 'Amazing summer sale with 50% off on all products', 
    description: 'Detailed campaign description' 
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  // Remove validation decorators for mediaFiles since it's handled by FilesInterceptor
  @ApiProperty({ 
    type: 'array', 
    items: { type: 'string', format: 'binary' },
    description: 'Media files (images/videos)',
  })
  mediaFiles?: Express.Multer.File[]; // Make optional, validated in controller

  // Change this to accept string (will be parsed in controller)
  @ApiProperty({ 
    type: 'string',
    description: 'Geographical targeting for campaign (JSON string)',
    example: '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}'
  })
  @IsNotEmpty()
  @IsString()
  targetedLocation: string; // Will be parsed to object

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMin?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMax?: number;

  @ApiProperty({ example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  budget: number;

  @ApiProperty({ example: '2024-12-20T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31T23:59:59Z' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}