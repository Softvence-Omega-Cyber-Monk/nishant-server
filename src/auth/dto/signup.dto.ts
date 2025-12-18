import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'User phone number (10 digits)',
    example: '9876543210',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, { message: 'Phone must be 10 digits' })
  phone: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: '123456',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Aadhaar number (12 digits)',
    example: '123456789012',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{12}$/, { message: 'Aadhaar must be 12 digits' })
  aadharNumber: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: ['USER', 'ADMIN', 'VENDOR'],
    default: 'USER',
  })
  @IsOptional()
  @IsEnum(['USER', 'ADMIN', 'VENDOR'])
  role?: string;
}