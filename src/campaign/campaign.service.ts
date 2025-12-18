import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { NotificationService } from '../notification/notification.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaymentVerificationDto } from './dto/payment-verification.dto';
import * as crypto from 'crypto';

@Injectable()
export class CampaignService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private razorpay: RazorpayService,
    private notification: NotificationService,
  ) {}

  async createCampaign(vendorId: string, dto: CreateCampaignDto, files: Express.Multer.File[]) {
    // Verify vendor role
    const vendor = await this.prisma.user.findUnique({
      where: { userId: vendorId },
    });

    if (!vendor || vendor.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can create campaigns');
    }

    // Upload media to Cloudinary
    const mediaUrls = await Promise.all(
      files.map(async (file) => {
        const result = await this.cloudinary.uploadFile(file);
        return {
          type: file.mimetype.startsWith('image/') ? 'image' : 'video',
          url: result.secure_url,
          publicId: result.public_id,
        };
      }),
    );

    // Create Razorpay order
    const amount = dto.budget * 100; // Convert to paise
    const order = await this.razorpay.createOrder({
      amount,
      currency: 'INR',
      receipt: `campaign_${Date.now()}`,
    });

    // Create campaign with PENDING payment status
    const campaign = await this.prisma.campaign.create({
      data: {
        vendorId,
        title: dto.title,
        description: dto.description,
        mediaUrls: mediaUrls as any,
        targetedLocation: dto.targetedLocation as any,
        targetedAgeMin: dto.targetedAgeMin,
        targetedAgeMax: dto.targetedAgeMax,
        budget: dto.budget,
        remainingSpending: dto.budget,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        razorpayOrderId: order.id,
        status: 'PAUSED',
      },
    });

    return {
      campaign,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    };
  }

  async verifyPaymentAndActivateCampaign(dto: PaymentVerificationDto) {
    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Update campaign
    const campaign = await this.prisma.campaign.update({
      where: { campaignId: dto.campaignId },
      data: {
        razorpayPaymentId: dto.razorpayPaymentId,
        razorpaySignature: dto.razorpaySignature,
        paymentStatus: 'SUCCESS',
        status: 'RUNNING',
      },
      include: { vendor: true },
    });

    // Create transaction record
    await this.prisma.transaction.create({
      data: {
        userId: campaign.vendorId,
        campaignId: campaign.campaignId,
        amount: campaign.budget,
        type: 'CAMPAIGN_PAYMENT',
        status: 'SUCCESS',
        razorpayOrderId: dto.razorpayOrderId,
        razorpayPaymentId: dto.razorpayPaymentId,
        razorpaySignature: dto.razorpaySignature,
        description: `Payment for campaign: ${campaign.title}`,
      },
    });

    // Send notification
    await this.notification.sendNotification(campaign.vendorId, {
      type: 'PAYMENT_SUCCESS',
      title: 'Campaign Payment Successful',
      message: `Your campaign "${campaign.title}" is now live!`,
      data: { campaignId: campaign.campaignId },
    });

    return campaign;
  }

  async getVendorCampaigns(vendorId: string, status?: string) {
    const where: any = { vendorId };
    if (status) {
      where.status = status;
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      include: {
        _count: {
          select: {
            likes: true,
            dislikes: true,
            loves: true,
            comments: true,
            shares: true,
            saves: true,
            impressions: true,
            clicks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  }

  async getCampaignDetails(campaignId: string, vendorId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
      include: {
        comments: {
          include: {
            user: {
              select: {
                userId: true,
                fullName: true,
                photo: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    userId: true,
                    fullName: true,
                    photo: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            likes: true,
            dislikes: true,
            loves: true,
            comments: true,
            shares: true,
            saves: true,
            impressions: true,
            clicks: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.vendorId !== vendorId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    // Calculate CTR
    const ctr = campaign.impressionCount > 0 
      ? (campaign.clickCount / campaign.impressionCount) * 100 
      : 0;

    // Get location-based stats
    const locationStats = await this.getLocationStats(campaignId);

    return {
      ...campaign,
      ctr: ctr.toFixed(2),
      locationStats,
    };
  }

  async getLocationStats(campaignId: string) {
    const impressions = await this.prisma.impression.findMany({
      where: { campaignId },
      select: { location: true },
    });

    const clicks = await this.prisma.click.findMany({
      where: { campaignId },
      select: { location: true },
    });

    // Aggregate by location
    const stats: any = {};
    
    impressions.forEach((imp: any) => {
      if (imp.location?.city) {
        const key = imp.location.city;
        if (!stats[key]) {
          stats[key] = { impressions: 0, clicks: 0 };
        }
        stats[key].impressions++;
      }
    });

    clicks.forEach((click: any) => {
      if (click.location?.city) {
        const key = click.location.city;
        if (!stats[key]) {
          stats[key] = { impressions: 0, clicks: 0 };
        }
        stats[key].clicks++;
      }
    });

    // Calculate CTR for each location
    Object.keys(stats).forEach((location) => {
      stats[location].ctr = stats[location].impressions > 0
        ? ((stats[location].clicks / stats[location].impressions) * 100).toFixed(2)
        : 0;
    });

    return stats;
  }

  async updateCampaign(campaignId: string, vendorId: string, dto: UpdateCampaignDto, files?: Express.Multer.File[]) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.vendorId !== vendorId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    const updateData: any = { ...dto };

    // Upload new media if provided
    if (files && files.length > 0) {
      // Delete old media from Cloudinary
      const oldMedia = campaign.mediaUrls as any[];
      await Promise.all(
        oldMedia.map((media) => this.cloudinary.deleteFile(media.publicId)),
      );

      // Upload new media
      const mediaUrls = await Promise.all(
        files.map(async (file) => {
          const result = await this.cloudinary.uploadFile(file);
          return {
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            url: result.secure_url,
            publicId: result.public_id,
          };
        }),
      );
      updateData.mediaUrls = mediaUrls;
    }

    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }

    const updatedCampaign = await this.prisma.campaign.update({
      where: { campaignId },
      data: updateData,
    });

    return updatedCampaign;
  }

  async pauseCampaign(campaignId: string, vendorId: string) {
    return this.updateCampaignStatus(campaignId, vendorId, 'PAUSED');
  }

  async resumeCampaign(campaignId: string, vendorId: string) {
    return this.updateCampaignStatus(campaignId, vendorId, 'RUNNING');
  }

  private async updateCampaignStatus(campaignId: string, vendorId: string, status: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.vendorId !== vendorId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return this.prisma.campaign.update({
      where: { campaignId },
      data: { status: status as any },
    });
  }

  async deleteCampaign(campaignId: string, vendorId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.vendorId !== vendorId) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    // Delete media from Cloudinary
    const media = campaign.mediaUrls as any[];
    await Promise.all(
      media.map((m) => this.cloudinary.deleteFile(m.publicId)),
    );

    // Delete campaign
    await this.prisma.campaign.delete({
      where: { campaignId },
    });

    return { message: 'Campaign deleted successfully' };
  }

  async addComment(campaignId: string, userId: string, dto: CreateCommentDto) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        campaignId,
        userId,
        content: dto.content,
        parentId: dto.parentId,
      },
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            photo: true,
          },
        },
      },
    });

    // Update comment count
    await this.prisma.campaign.update({
      where: { campaignId },
      data: { commentCount: { increment: 1 } },
    });

    // Send notification to vendor
    if (campaign.vendorId !== userId) {
      await this.notification.sendNotification(campaign.vendorId, {
        type: 'NEW_COMMENT',
        title: 'New Comment on Campaign',
        message: `${comment.user.fullName} commented on "${campaign.title}"`,
        data: { campaignId, commentId: comment.commentId },
      });
    }

    return comment;
  }

  async getCampaignStats(vendorId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { vendorId },
      select: {
        campaignId: true,
        title: true,
        status: true,
        budget: true,
        currentSpending: true,
        remainingSpending: true,
        likeCount: true,
        dislikeCount: true,
        loveCount: true,
        commentCount: true,
        shareCount: true,
        saveCount: true,
        impressionCount: true,
        clickCount: true,
        conversionCount: true,
        ctr: true,
        createdAt: true,
      },
    });

    const totalSpending = campaigns.reduce((sum, c) => sum + c.currentSpending, 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);

    return {
      campaigns,
      summary: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === 'RUNNING').length,
        pausedCampaigns: campaigns.filter((c) => c.status === 'PAUSED').length,
        completedCampaigns: campaigns.filter((c) => c.status === 'COMPLETED').length,
        totalSpending,
        totalBudget,
        totalImpressions: campaigns.reduce((sum, c) => sum + c.impressionCount, 0),
        totalClicks: campaigns.reduce((sum, c) => sum + c.clickCount, 0),
        totalConversions: campaigns.reduce((sum, c) => sum + c.conversionCount, 0),
      },
    };
  }

  // Check and update campaign status based on budget and dates
 // Check and update campaign status based on budget and dates
async checkCampaignStatus(campaignId: string) {
  const campaign = await this.prisma.campaign.findUnique({
    where: { campaignId },
  });

  if (!campaign || campaign.status === 'COMPLETED') {
    return;
  }

  const now = new Date();
  let shouldUpdate = false;
  let newStatus: 'RUNNING' | 'PAUSED' | 'COMPLETED' = campaign.status;
  let notificationMessage = '';

  // Check if budget is exhausted
  if (campaign.remainingSpending <= 0) {
    newStatus = 'COMPLETED';
    notificationMessage = `Campaign "${campaign.title}" has exhausted its budget`;
    shouldUpdate = true;
  }
  // Check if end date has passed
  else if (now > campaign.endDate) {
    newStatus = 'COMPLETED';
    notificationMessage = `Campaign "${campaign.title}" has ended`;
    shouldUpdate = true;
  }
  // Check for low budget alert (less than 20%)
  else if (campaign.remainingSpending < campaign.budget * 0.2) {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId: campaign.vendorId },
    });

    if (settings?.lowBudgetAlert) {
      await this.notification.sendNotification(campaign.vendorId, {
        type: 'LOW_BUDGET_ALERT',
        title: 'Low Budget Alert',
        message: `Campaign "${campaign.title}" has less than 20% budget remaining`,
        data: { campaignId: campaign.campaignId },
      });
    }
  }

  if (shouldUpdate) {
    await this.prisma.campaign.update({
      where: { campaignId },
      data: { status: newStatus },
    });

    await this.notification.sendNotification(campaign.vendorId, {
      type: 'CAMPAIGN_COMPLETED',
      title: 'Campaign Completed',
      message: notificationMessage,
      data: { campaignId: campaign.campaignId },
    });
  }
}
}