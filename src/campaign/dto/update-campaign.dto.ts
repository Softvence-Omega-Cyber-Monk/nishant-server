import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiPropertyOptional({ 
    enum: ['RUNNING', 'PAUSED', 'COMPLETED'],
    description: 'Campaign status',
  })
  @IsOptional()
  @IsEnum(['RUNNING', 'PAUSED', 'COMPLETED'])
  status?: string;
}