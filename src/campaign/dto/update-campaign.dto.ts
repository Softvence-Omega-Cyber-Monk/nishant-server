// import {
//   IsEnum,
//   IsOptional,
//   IsString,
//   IsNumber,
//   IsDateString,
//   Min,
//   Max,
// } from 'class-validator';
// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { Transform } from 'class-transformer';

// export class UpdateCampaignDto {
//   @ApiPropertyOptional({
//     example: 'Updated Campaign Title',
//     description: 'Campaign title',
//   })
//   @IsOptional()
//   @IsString()
//   title?: string;

//   @ApiPropertyOptional({
//     example: 'Updated campaign description',
//     description: 'Detailed campaign description',
//   })
//   @IsOptional()
//   @IsString()
//   description?: string;

//   @ApiPropertyOptional({
//     type: 'string',
//     description: 'Geographical targeting for campaign (JSON string)',
//     example:
//       '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}',
//   })
//   @IsOptional()
//   targetedLocation?: string | object;

//   @ApiPropertyOptional({
//     example: 20,
//     description: 'Minimum target age',
//     minimum: 13,
//     maximum: 100,
//   })
//   @IsOptional()
//   @Transform(({ value }) => (value ? Number(value) : undefined))
//   @IsNumber()
//   @Min(13)
//   @Max(100)
//   targetedAgeMin?: number;

//   @ApiPropertyOptional({
//     example: 50,
//     description: 'Maximum target age',
//     minimum: 13,
//     maximum: 100,
//   })
//   @IsOptional()
//   @Transform(({ value }) => (value ? Number(value) : undefined))
//   @IsNumber()
//   @Min(13)
//   @Max(100)
//   targetedAgeMax?: number;

//   @ApiPropertyOptional({
//     example: 15000,
//     description: 'Campaign budget in INR',
//     minimum: 100,
//   })
//   @IsOptional()
//   @Transform(({ value }) => (value ? Number(value) : undefined))
//   @IsNumber()
//   @Min(100)
//   budget?: number;

//   @ApiPropertyOptional({
//     example: '2024-12-25T00:00:00Z',
//     description: 'Campaign start date and time',
//   })
//   @IsOptional()
//   @IsDateString()
//   startDate?: string;

//   @ApiPropertyOptional({
//     example: '2025-01-15T23:59:59Z',
//     description: 'Campaign end date and time',
//   })
//   @IsOptional()
//   @IsDateString()
//   endDate?: string;

//   @ApiPropertyOptional({
//     enum: ['RUNNING', 'PAUSED', 'COMPLETED'],
//     description: 'Campaign status',
//     example: 'PAUSED',
//   })
//   @IsOptional()
//   @IsEnum(['RUNNING', 'PAUSED', 'COMPLETED'])
//   status?: string;

//   @ApiPropertyOptional({
//     type: 'array',
//     items: { type: 'string', format: 'binary' },
//     description: 'Replace media files (optional)',
//   })
//   mediaFiles?: Express.Multer.File[];
// }



import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    example: 'Updated Campaign Title',
    description: 'Campaign title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated campaign description with new offers!',
    description: 'Detailed campaign description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // === LOCATION TARGETING (Backward Compatible) ===
  @ApiPropertyOptional({
    type: 'string',
    description: 'Geographical targeting (JSON string or object)',
    example: '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject({ message: 'targetedLocation must be a valid JSON object' })
  targetedLocation?: {
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    radius?: number;
  };

  // Optional: Direct coordinate override (advanced)
  @ApiPropertyOptional({
    example: 19.076,
    description: 'Override latitude (bypasses geocoding)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetLatitude?: number;

  @ApiPropertyOptional({
    example: 72.8777,
    description: 'Override longitude (bypasses geocoding)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetLongitude?: number;

  @ApiPropertyOptional({
    example: 75,
    description: 'Target radius in kilometers',
    minimum: 5,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(200)
  targetRadiusKm?: number;

  // === AGE TARGETING ===
  @ApiPropertyOptional({
    example: 20,
    description: 'Minimum target age',
    minimum: 13,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
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
  @Type(() => Number)
  @IsNumber()
  @Min(13)
  @Max(100)
  targetedAgeMax?: number;

  // === BUDGET & DATES ===
  @ApiPropertyOptional({
    example: 20000,
    description: 'Updated campaign budget in INR',
    minimum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  budget?: number;

  @ApiPropertyOptional({
    example: '2025-12-25T00:00:00Z',
    description: 'Updated campaign start date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-20T23:59:59Z',
    description: 'Updated campaign end date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // === STATUS ===
  @ApiPropertyOptional({
    enum: ['RUNNING', 'PAUSED', 'COMPLETED'],
    description: 'Campaign status',
    example: 'RUNNING',
  })
  @IsOptional()
  @IsEnum(['RUNNING', 'PAUSED', 'COMPLETED'])
  status?: 'RUNNING' | 'PAUSED' | 'COMPLETED';

  // === MEDIA ===
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Replace or add new media files (optional)',
  })
  mediaFiles?: Express.Multer.File[];
}