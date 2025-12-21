import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DigilockerCallbackDto {
  @ApiProperty({
    description: 'Authorization code from DigiLocker OAuth',
    example: '0377cdccb4ed02737e5121ed06cc...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: 'State parameter for CSRF protection',
  })
  @IsString()
  @IsOptional()
  state?: string;
}
