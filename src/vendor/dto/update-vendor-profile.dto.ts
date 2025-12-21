import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVendorProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of vendor',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: 'Leading technology vendor specializing in digital marketing',
    description: 'Vendor description/bio',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Technology',
    description: 'Business category',
    enum: ['Technology', 'Fashion', 'Food', 'Healthcare', 'Education', 'Other'],
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Mumbai, Maharashtra, India',
    description: 'Business location',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'vendor@example.com',
    description: 'Contact email',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    example: 'https://instagram.com/vendor',
    description: 'Instagram profile URL',
  })
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @ApiPropertyOptional({
    example: 'https://facebook.com/vendor',
    description: 'Facebook page URL',
  })
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @ApiPropertyOptional({
    example: 'https://vendor.com',
    description: 'Business website URL',
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Profile photo file',
  })
  @IsOptional()
  photo?: Express.Multer.File;
}
