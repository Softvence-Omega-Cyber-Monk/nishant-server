import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteVendorProfileDto {
  @ApiPropertyOptional({
    example: 'e50442d2-1144-49fb-8e24-350b01ee3520',
    description: 'Give Id of the vendor profile to be deleted',
  })
  @IsOptional()
  @IsString()
  vendorId?: string;
}
