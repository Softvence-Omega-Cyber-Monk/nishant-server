import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ 
    example: true, 
    description: 'Receive daily performance summary notifications' 
  })
  @IsOptional()
  @IsBoolean()
  campaignPerformanceUpdates?: boolean;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Receive alerts when campaign budget is low (< 20%)' 
  })
  @IsOptional()
  @IsBoolean()
  lowBudgetAlert?: boolean;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Receive notifications for payment and transaction updates' 
  })
  @IsOptional()
  @IsBoolean()
  paymentTransactionUpdates?: boolean;

  @ApiPropertyOptional({ 
    example: true, 
    description: 'Receive live updates about campaign status changes' 
  })
  @IsOptional()
  @IsBoolean()
  liveCampaignUpdates?: boolean;
}