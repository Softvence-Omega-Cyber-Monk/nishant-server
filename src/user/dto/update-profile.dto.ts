import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';



export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: 'A happy soul living in Mumbai',
    description: 'Short bio/description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Male',
    enum: ['Male', 'Female', 'Other'],
    description: 'Gender',
  })
  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'])
  gender?: 'Male' | 'Female' | 'Other';

  @ApiPropertyOptional({
    example: 'Andheri West, Mumbai, Maharashtra, India',
    description: 'Readable location (will be geocoded)',
  })
  @IsOptional()
  @IsString()
  location?: string;
}