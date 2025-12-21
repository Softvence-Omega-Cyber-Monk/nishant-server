import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CampaignService } from '../campaign/campaign.service';

@Injectable()
export class EngagementService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private campaignService: CampaignService,
  ) {}

  // ==================== LIKE ====================
  async toggleLike(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.like.delete({
        where: { likeId: existingLike.likeId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { likeCount: { decrement: 1 } },
      });

      return { action: 'unliked', liked: false };
    } else {
      // Like
      await this.prisma.like.create({
        data: { campaignId, userId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { likeCount: { increment: 1 } },
      });

      return { action: 'liked', liked: true };
    }
  }

  // ==================== DISLIKE ====================
  async toggleDislike(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const existingDislike = await this.prisma.dislike.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    });

    if (existingDislike) {
      // Remove dislike
      await this.prisma.dislike.delete({
        where: { dislikeId: existingDislike.dislikeId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { dislikeCount: { decrement: 1 } },
      });

      return { action: 'removed_dislike', disliked: false };
    } else {
      // Dislike
      await this.prisma.dislike.create({
        data: { campaignId, userId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { dislikeCount: { increment: 1 } },
      });

      return { action: 'disliked', disliked: true };
    }
  }

  // ==================== LOVE ====================
  async toggleLove(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const existingLove = await this.prisma.love.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    });

    if (existingLove) {
      // Remove love
      await this.prisma.love.delete({
        where: { loveId: existingLove.loveId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { loveCount: { decrement: 1 } },
      });

      return { action: 'unloved', loved: false };
    } else {
      // Love
      await this.prisma.love.create({
        data: { campaignId, userId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { loveCount: { increment: 1 } },
      });

      return { action: 'loved', loved: true };
    }
  }

  // ==================== SHARE ====================
  async shareCampaign(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    await this.prisma.share.create({
      data: { campaignId, userId },
    });

    await this.prisma.campaign.update({
      where: { campaignId },
      data: { shareCount: { increment: 1 } },
    });

    return { message: 'Campaign shared successfully' };
  }

  // ==================== SAVE ====================
  async toggleSave(campaignId: string, userId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const existingSave = await this.prisma.save.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
      },
    });

    if (existingSave) {
      // Unsave
      await this.prisma.save.delete({
        where: { saveId: existingSave.saveId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { saveCount: { decrement: 1 } },
      });

      return { action: 'unsaved', saved: false };
    } else {
      // Save
      await this.prisma.save.create({
        data: { campaignId, userId },
      });

      await this.prisma.campaign.update({
        where: { campaignId },
        data: { saveCount: { increment: 1 } },
      });

      return { action: 'saved', saved: true };
    }
  }

  // ==================== IMPRESSION ====================
  async recordImpression(
    campaignId: string,
    userId: string,
    metadata?: { location?: any; deviceType?: string },
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Check if already recorded in last 24 hours to avoid duplicates
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentImpression = await this.prisma.impression.findFirst({
      where: {
        campaignId,
        userId,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (!recentImpression) {
      await this.prisma.impression.create({
        data: {
          campaignId,
          userId,
          location: metadata?.location || null,
          deviceType: metadata?.deviceType || null,
        },
      });

      const updatedCampaign = await this.prisma.campaign.update({
        where: { campaignId },
        data: { impressionCount: { increment: 1 } },
      });

      // Update CTR
      if (updatedCampaign.impressionCount > 0) {
        const ctr =
          (updatedCampaign.clickCount / updatedCampaign.impressionCount) * 100;
        await this.prisma.campaign.update({
          where: { campaignId },
          data: { ctr },
        });
      }
    }

    return { message: 'Impression recorded' };
  }

  // ==================== CLICK ====================
  async recordClick(
    campaignId: string,
    userId: string,
    metadata?: { location?: any; deviceType?: string },
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    await this.prisma.click.create({
      data: {
        campaignId,
        userId,
        location: metadata?.location || null,
        deviceType: metadata?.deviceType || null,
      },
    });

    const updatedCampaign = await this.prisma.campaign.update({
      where: { campaignId },
      data: { clickCount: { increment: 1 } },
    });

    // Update CTR
    if (updatedCampaign.impressionCount > 0) {
      const ctr =
        (updatedCampaign.clickCount / updatedCampaign.impressionCount) * 100;
      await this.prisma.campaign.update({
        where: { campaignId },
        data: { ctr },
      });
    }

    // Deduct from budget (example: $0.50 per click)
    const costPerClick = 0.5;
    const newSpending = updatedCampaign.currentSpending + costPerClick;
    const newRemaining = updatedCampaign.budget - newSpending;

    await this.prisma.campaign.update({
      where: { campaignId },
      data: {
        currentSpending: newSpending,
        remainingSpending: newRemaining,
      },
    });

    // Check campaign status
    await this.campaignService.checkCampaignStatus(campaignId);

    return { message: 'Click recorded' };
  }

  // ==================== CONVERSION ====================
  async recordConversion(
    campaignId: string,
    userId: string,
    data?: { amount?: number; type?: string; metadata?: any },
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    await this.prisma.conversion.create({
      data: {
        campaignId,
        userId,
        amount: data?.amount || null,
        type: data?.type || 'general',
        metadata: data?.metadata || null,
      },
    });

    await this.prisma.campaign.update({
      where: { campaignId },
      data: { conversionCount: { increment: 1 } },
    });

    // Notify vendor
    await this.notificationService.sendNotification(campaign.vendorId, {
      type: 'NEW_CONVERSION',
      title: 'New Conversion',
      message: `Your campaign "${campaign.title}" received a conversion!`,
      data: { campaignId, conversionType: data?.type },
    });

    return { message: 'Conversion recorded' };
  }

  // ==================== GET USER ENGAGEMENT STATUS ====================
  async getUserEngagementStatus(campaignId: string, userId: string) {
    const [liked, disliked, loved, saved] = await Promise.all([
      this.prisma.like.findUnique({
        where: { campaignId_userId: { campaignId, userId } },
      }),
      this.prisma.dislike.findUnique({
        where: { campaignId_userId: { campaignId, userId } },
      }),
      this.prisma.love.findUnique({
        where: { campaignId_userId: { campaignId, userId } },
      }),
      this.prisma.save.findUnique({
        where: { campaignId_userId: { campaignId, userId } },
      }),
    ]);

    return {
      liked: !!liked,
      disliked: !!disliked,
      loved: !!loved,
      saved: !!saved,
    };
  }
}
