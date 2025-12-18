import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  campaignPerformanceUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  lowBudgetAlert?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentTransactionUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  liveCampaignUpdates?: boolean;
}
