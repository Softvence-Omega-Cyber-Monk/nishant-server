import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiPropertyOptional({ example: 'S/O John Smith' })
  co?: string;

  @ApiPropertyOptional({ example: 'House No 123' })
  house?: string;

  @ApiPropertyOptional({ example: 'Main Street' })
  street?: string;

  @ApiPropertyOptional({ example: 'Near Park' })
  landmark?: string;

  @ApiPropertyOptional({ example: 'Green Valley' })
  locality?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  vtc?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  dist?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  state?: string;

  @ApiPropertyOptional({ example: 'India' })
  country?: string;

  @ApiPropertyOptional({ example: '400001' })
  pincode?: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: '9876543210' })
  phone: string;

  @ApiProperty({ example: 'USER', enum: ['USER', 'ADMIN'] })
  role: string;

  @ApiProperty({ example: true })
  aadhaarVerified: boolean;

  @ApiProperty({ example: 'XXXX XXXX 9012', required: false })
  maskedAadhaar?: string;

  @ApiPropertyOptional({ example: 'M' })
  gender?: string;

  @ApiPropertyOptional({ example: '1990-01-15T00:00:00.000Z' })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ type: AddressDto })
  address?: AddressDto;

  @ApiPropertyOptional({ example: '/9j/4AAQSkZJRg...' })
  photo?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token (expires in 15 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token (expires in 7 days)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}

export class AadhaarVerificationResponseDto {
  @ApiProperty({ example: true })
  verified: boolean;

  @ApiProperty({ example: 'Aadhaar verified successfully' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}