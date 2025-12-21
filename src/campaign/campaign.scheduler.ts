import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignService } from './campaign.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CampaignScheduler {
  constructor(
    private prisma: PrismaService,
    private campaignService: CampaignService,
    private notificationService: NotificationService,
  ) {}

  // Check campaign status every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkCampaignStatuses() {
    console.log('Checking campaign statuses...');

    const runningCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'RUNNING',
      },
    });

    for (const campaign of runningCampaigns) {
      await this.campaignService.checkCampaignStatus(campaign.campaignId);
    }
  }

  // Send daily performance summary
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyPerformanceSummary() {
    console.log('Sending daily performance summaries...');

    const vendors = await this.prisma.user.findMany({
      where: { role: 'VENDOR' },
      include: {
        campaigns: {
          where: { status: 'RUNNING' },
        },
        notificationSettings: true,
      },
    });

    for (const vendor of vendors) {
      if (
        vendor.notificationSettings?.campaignPerformanceUpdates &&
        vendor.campaigns.length > 0
      ) {
        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);

        const yesterdayEnd = new Date();
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);

        // Get yesterday's impressions and clicks
        const [impressions, clicks] = await Promise.all([
          this.prisma.impression.count({
            where: {
              campaign: { vendorId: vendor.userId },
              createdAt: {
                gte: yesterdayStart,
                lte: yesterdayEnd,
              },
            },
          }),
          this.prisma.click.count({
            where: {
              campaign: { vendorId: vendor.userId },
              createdAt: {
                gte: yesterdayStart,
                lte: yesterdayEnd,
              },
            },
          }),
        ]);

        if (impressions > 0 || clicks > 0) {
          await this.notificationService.sendNotification(vendor.userId, {
            type: 'CAMPAIGN_PERFORMANCE',
            title: 'Daily Performance Summary',
            message: `Yesterday: ${impressions} impressions, ${clicks} clicks across your campaigns`,
            data: { impressions, clicks, date: yesterdayStart.toISOString() },
          });
        }
      }
    }
  }

  // Check for campaigns ending soon
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async notifyEndingSoonCampaigns() {
    console.log('Checking for campaigns ending soon...');

    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    const endingSoonCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: 'RUNNING',
        endDate: {
          lte: twoDaysFromNow,
        },
      },
      include: {
        vendor: {
          include: {
            notificationSettings: true,
          },
        },
      },
    });

    for (const campaign of endingSoonCampaigns) {
      if (campaign.vendor.notificationSettings?.liveCampaignUpdates) {
        const daysRemaining = Math.ceil(
          (campaign.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        await this.notificationService.sendNotification(campaign.vendorId, {
          type: 'CAMPAIGN_ENDING_SOON',
          title: 'Campaign Ending Soon',
          message: `"${campaign.title}" will end in ${daysRemaining} day(s)`,
          data: { campaignId: campaign.campaignId, daysRemaining },
        });
      }
    }
  }

  // Update CTR for all campaigns
  @Cron(CronExpression.EVERY_6_HOURS)
  async updateCampaignCTR() {
    console.log('Updating campaign CTR...');

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: { in: ['RUNNING', 'PAUSED', 'COMPLETED'] },
        impressionCount: { gt: 0 },
      },
    });

    for (const campaign of campaigns) {
      const ctr = (campaign.clickCount / campaign.impressionCount) * 100;

      await this.prisma.campaign.update({
        where: { campaignId: campaign.campaignId },
        data: { ctr },
      });
    }
  }
}
