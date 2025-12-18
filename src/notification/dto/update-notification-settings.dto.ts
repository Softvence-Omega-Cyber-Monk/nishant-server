// src/notification/dto/update-notification-settings.dto.ts
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ 
    description: 'Receive daily campaign performance summaries (sent at 9 AM)',
    example: true,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  campaignPerformanceUpdates?: boolean;

  @ApiPropertyOptional({ 
    description: 'Receive real-time updates on campaign status changes (running, paused, completed)',
    example: true,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  liveCampaignUpdates?: boolean;

  @ApiPropertyOptional({ 
    description: 'Get alerted when campaign budget drops below 20%',
    example: true,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  lowBudgetAlert?: boolean;

  @ApiPropertyOptional({ 
    description: 'Receive notifications when users comment on your campaigns',
    example: true,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  newCommentNotification?: boolean;

  @ApiPropertyOptional({ 
    description: 'Receive notifications when users follow your vendor account',
    example: false,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  newFollowerNotification?: boolean;

  @ApiPropertyOptional({ 
    description: 'Enable email notifications for all enabled notification types',
    example: true,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ 
    description: 'Enable push notifications on mobile devices',
    example: true,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}