import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('engagement')
@UseGuards(JwtAuthGuard)
export class EngagementController {
  constructor(private engagementService: EngagementService) {}

  @Post('campaigns/:campaignId/like')
  async toggleLike(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleLike(campaignId, userId);
  }

  @Post('campaigns/:campaignId/dislike')
  async toggleDislike(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleDislike(campaignId, userId);
  }

  @Post('campaigns/:campaignId/love')
  async toggleLove(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleLove(campaignId, userId);
  }

  @Post('campaigns/:campaignId/share')
  async shareCampaign(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.shareCampaign(campaignId, userId);
  }

  @Post('campaigns/:campaignId/save')
  async toggleSave(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleSave(campaignId, userId);
  }

  @Post('campaigns/:campaignId/impression')
  async recordImpression(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: { location?: any; deviceType?: string },
  ) {
    return this.engagementService.recordImpression(campaignId, userId, body);
  }

  @Post('campaigns/:campaignId/click')
  async recordClick(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: { location?: any; deviceType?: string },
  ) {
    return this.engagementService.recordClick(campaignId, userId, body);
  }

  @Post('campaigns/:campaignId/conversion')
  async recordConversion(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: { amount?: number; type?: string; metadata?: any },
  ) {
    return this.engagementService.recordConversion(campaignId, userId, body);
  }

  @Get('campaigns/:campaignId/status')
  async getEngagementStatus(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.getUserEngagementStatus(campaignId, userId);
  }
}