import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyAadhaarDto {
  @ApiProperty({
    description: 'DigiLocker access token received from OAuth callback',
    example: '0377cdccb4ed02737e5121ed06ccXXXXXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}