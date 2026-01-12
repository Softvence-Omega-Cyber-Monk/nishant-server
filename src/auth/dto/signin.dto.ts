import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'Email or phone number',
    example: 'nahid@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: 'User password',
    example: '123456A@',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
