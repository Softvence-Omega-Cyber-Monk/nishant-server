// src/engagement/dto/engagement.dto.ts
import { IsOptional, IsString, IsNumber, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LocationDto {
  @ApiPropertyOptional({ 
    description: 'Country',
    example: 'Bangladesh'
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ 
    description: 'State or division',
    example: 'Dhaka Division'
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ 
    description: 'City',
    example: 'Dhaka'
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ 
    description: 'Latitude coordinate',
    example: 23.8103
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ 
    description: 'Longitude coordinate',
    example: 90.4125
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class RecordImpressionDto {
  @ApiPropertyOptional({ 
    description: 'User location when impression occurred',
    type: LocationDto
  })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({ 
    description: 'Device type (mobile, tablet, desktop)',
    example: 'mobile',
    enum: ['mobile', 'tablet', 'desktop']
  })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class RecordClickDto {
  @ApiPropertyOptional({ 
    description: 'User location when click occurred',
    type: LocationDto
  })
  @IsOptional()
  @IsObject()
  location?: LocationDto;

  @ApiPropertyOptional({ 
    description: 'Device type (mobile, tablet, desktop)',
    example: 'mobile',
    enum: ['mobile', 'tablet', 'desktop']
  })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class RecordConversionDto {
  @ApiPropertyOptional({ 
    description: 'Conversion amount (e.g., purchase value)',
    example: 1500,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ 
    description: 'Type of conversion',
    example: 'purchase',
    enum: ['purchase', 'signup', 'download', 'subscription', 'general']
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ 
    description: 'Additional conversion metadata',
    example: {
      productId: 'prod_123',
      quantity: 2,
      category: 'electronics'
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}