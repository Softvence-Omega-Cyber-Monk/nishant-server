import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RazorpayService } from '../razorpay/razorpay.service';
import { NotificationService } from '../notification/notification.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaymentVerificationDto } from './dto/payment-verification.dto';
import NodeGeocoder from 'node-geocoder';

@Injectable()
export class CampaignService {
  private readonly geocoder: NodeGeocoder.Geocoder;
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private razorpay: RazorpayService,
    private notification: NotificationService,
  ) {
this.geocoder = NodeGeocoder({
      provider: 'openstreetmap', 
    });

  }


async createCampaign(
  vendorId: string,
  dto: CreateCampaignDto,
  files: Express.Multer.File[],
) {
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

  // ==================== GEOCODING: Extract address and geocode ====================
  let targetLatitude: number | undefined = undefined;
  let targetLongitude: number | undefined = undefined;
  const radiusKm = dto.targetedLocation.radius ?? 50;

  // Use manual override if provided (dto fields are optional → number | undefined)
  if (dto.targetLatitude !== undefined && dto.targetLongitude !== undefined) {
    targetLatitude = dto.targetLatitude;
    targetLongitude = dto.targetLongitude;
  } else {
    // Build address string from targetedLocation (preserve old behavior)
    const parts = [
      dto.targetedLocation.address,
      dto.targetedLocation.city,
      dto.targetedLocation.state,
      dto.targetedLocation.country,
    ].filter(Boolean);

    const addressString = parts.join(', ') || 'India'; // fallback to India

    const res = await this.geocoder.geocode(addressString);

    if (res.length === 0) {
      throw new BadRequestException('Unable to geocode the targeted location.');
    }

    targetLatitude = res[0].latitude;
    targetLongitude = res[0].longitude;
  }

  // ==================== DEMO MODE: Mock Razorpay ====================
  const demoOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const amount = dto.budget * 100;

  const order = {
    id: demoOrderId,
    amount: amount,
    currency: 'INR',
    receipt: `campaign_${Date.now()}`,
    status: 'created',
  };

  console.log('🎭 DEMO MODE: Created mock Razorpay order:', order);

  // ==================== Create Campaign ====================
  const campaign = await this.prisma.campaign.create({
    data: {
      vendorId,
      title: dto.title,
      description: dto.description,
      mediaUrls: mediaUrls as any,

      // Keep original targetedLocation JSON exactly as sent by frontend
      targetedLocation: dto.targetedLocation as any,

      // New accurate geo fields for location-based feed
      targetLatitude: targetLatitude ?? null,     // Converts undefined → null for DB
      targetLongitude: targetLongitude ?? null,   // Prisma optional Float accepts null
      targetRadiusKm: radiusKm,

      targetedAgeMin: dto.targetedAgeMin,
      targetedAgeMax: dto.targetedAgeMax,

      budget: dto.budget,
      remainingSpending: dto.budget,
      currentSpending: 0,

      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),

      razorpayOrderId: order.id,
      status: 'PAUSED',
      paymentStatus: 'PENDING',
    },
  });

  return {
    campaign,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    demoMode: true,
    message: '⚠️ DEMO MODE: Use verify-payment endpoint to activate campaign',
  };
}




// async createCampaign(
//     vendorId: string,
//     dto: CreateCampaignDto,
//     files: Express.Multer.File[],
//   ) {
//     // Verify vendor role
//     const vendor = await this.prisma.user.findUnique({
//       where: { userId: vendorId },
//     });

//     if (!vendor || vendor.role !== 'VENDOR') {
//       throw new ForbiddenException('Only vendors can create campaigns');
//     }

//     // Upload media to Cloudinary
//     const mediaUrls = await Promise.all(
//       files.map(async (file) => {
//         const result = await this.cloudinary.uploadFile(file);
//         return {
//           type: file.mimetype.startsWith('image/') ? 'image' : 'video',
//           url: result.secure_url,
//           publicId: result.public_id,
//         };
//       }),
//     );

//     // ==================== DEMO MODE: Using mock Razorpay order ====================
//     // Generate demo order ID
//     const demoOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     const amount = dto.budget * 100; // Convert to paise

//     // Mock order object (comment out real API call)
//     const order = {
//       id: demoOrderId,
//       amount: amount,
//       currency: 'INR',
//       receipt: `campaign_${Date.now()}`,
//       status: 'created',
//     };

//     console.log('🎭 DEMO MODE: Created mock Razorpay order:', order);

//     // ==================== REAL MODE (COMMENTED OUT) ====================
//     // Uncomment this when you want to use real Razorpay
//     /*
//     const amount = dto.budget * 100; // Convert to paise
//     const order = await this.razorpay.createOrder({
//       amount,
//       currency: 'INR',
//       receipt: `campaign_${Date.now()}`,
//     });
//     */
//     // ==================== END REAL MODE ====================

//     // Create campaign with PENDING payment status
//     const campaign = await this.prisma.campaign.create({
//       data: {
//         vendorId,
//         title: dto.title,
//         description: dto.description,
//         mediaUrls: mediaUrls as any,
//         targetedLocation: dto.targetedLocation as any,
//         targetedAgeMin: dto.targetedAgeMin,
//         targetedAgeMax: dto.targetedAgeMax,
//         budget: dto.budget,
//         remainingSpending: dto.budget,
//         startDate: new Date(dto.startDate),
//         endDate: new Date(dto.endDate),
//         razorpayOrderId: order.id,
//         status: 'PAUSED',
//       },
//     });

//     return {
//       campaign,
//       order: {
//         id: order.id,
//         amount: order.amount,
//         currency: order.currency,
//       },
//       demoMode: true, // Flag to indicate demo mode
//       message:
//         '⚠️ DEMO MODE: Use the verify-payment endpoint with this order ID to activate campaign',
//     };
//   }


  async verifyPaymentAndActivateCampaign(dto: PaymentVerificationDto) {
    // ==================== DEMO MODE: Skip signature verification ====================
    console.log('🎭 DEMO MODE: Skipping Razorpay signature verification');
    console.log('Demo payment data:', dto);

    // In demo mode, we'll just check if the order ID starts with 'order_demo_'
    const isDemoMode = dto.razorpayOrderId.startsWith('order_demo_');

    if (!isDemoMode) {
      // ==================== REAL MODE (COMMENTED OUT) ====================
      // Uncomment this when you want to use real Razorpay verification
      /*
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== dto.razorpaySignature) {
        throw new BadRequestException('Invalid payment signature');
      }
      */
      // ==================== END REAL MODE ====================

      console.log(
        '⚠️ Non-demo order ID detected but verification skipped in demo mode',
      );
    }

    // Update campaign
    const campaign = await this.prisma.campaign.update({
      where: { campaignId: dto.campaignId },
      data: {
        razorpayPaymentId: dto.razorpayPaymentId || `pay_demo_${Date.now()}`,
        razorpaySignature: dto.razorpaySignature || `sig_demo_${Date.now()}`,
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
        razorpayPaymentId: dto.razorpayPaymentId || `pay_demo_${Date.now()}`,
        razorpaySignature: dto.razorpaySignature || `sig_demo_${Date.now()}`,
        description: `Payment for campaign: ${campaign.title} (DEMO MODE)`,
      },
    });

    // Send notification
    await this.notification.sendNotification(campaign.vendorId, {
      type: 'PAYMENT_SUCCESS',
      title: 'Campaign Payment Successful',
      message: `Your campaign "${campaign.title}" is now live! (Demo Mode)`,
      data: { campaignId: campaign.campaignId, demoMode: true },
    });

    console.log('✅ DEMO MODE: Campaign activated successfully');

    return {
      ...campaign,
      demoMode: true,
      message: '✅ Campaign activated in DEMO MODE',
    };
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
    const ctr =
      campaign.impressionCount > 0
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
      stats[location].ctr =
        stats[location].impressions > 0
          ? (
              (stats[location].clicks / stats[location].impressions) *
              100
            ).toFixed(2)
          : 0;
    });

    return stats;
  }



async updateCampaign(
  campaignId: string,
  vendorId: string,
  dto: UpdateCampaignDto,
  files?: Express.Multer.File[],
) {
  const campaign = await this.prisma.campaign.findUnique({
    where: { campaignId },
  });

  if (!campaign) {
    throw new NotFoundException('Campaign not found');
  }

  if (campaign.vendorId !== vendorId) {
    throw new ForbiddenException('You do not have access to this campaign');
  }

  // Prepare update data
  const updateData: any = {};

  // Simple fields - copy if provided
  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.targetedAgeMin !== undefined) updateData.targetedAgeMin = dto.targetedAgeMin;
  if (dto.targetedAgeMax !== undefined) updateData.targetedAgeMax = dto.targetedAgeMax;
  if (dto.budget !== undefined) updateData.budget = dto.budget;
  if (dto.status !== undefined) updateData.status = dto.status;

  // Date fields
  if (dto.startDate !== undefined) {
    updateData.startDate = new Date(dto.startDate);
  }
  if (dto.endDate !== undefined) {
    updateData.endDate = new Date(dto.endDate);
  }

  // ==================== MEDIA REPLACEMENT ====================
  if (files && files.length > 0) {
    // Delete old media from Cloudinary
    const oldMedia = campaign.mediaUrls as any[];
    if (oldMedia && oldMedia.length > 0) {
      await Promise.all(
        oldMedia.map((media: any) => this.cloudinary.deleteFile(media.publicId)),
      );
    }

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

  // ==================== LOCATION UPDATE & GEOCODING ====================
  let shouldUpdateGeo = false;

  // If targetedLocation is provided (from frontend)
  if (dto.targetedLocation !== undefined) {
    updateData.targetedLocation = dto.targetedLocation;
    shouldUpdateGeo = true;
  }

  // If manual coordinates are provided, use them directly
  if (dto.targetLatitude !== undefined && dto.targetLongitude !== undefined) {
    updateData.targetLatitude = dto.targetLatitude;
    updateData.targetLongitude = dto.targetLongitude;
    shouldUpdateGeo = false; // No need to geocode
  }

  // If targetedLocation changed but no manual coords → geocode it
  if (shouldUpdateGeo) {
    let targetLatitude: number | undefined = undefined;
    let targetLongitude: number | undefined = undefined;
    let radiusKm = dto.targetedLocation?.radius ?? campaign.targetRadiusKm ?? 50;

    // Prefer manual override (already handled above), otherwise geocode
    if (dto.targetLatitude !== undefined && dto.targetLongitude !== undefined) {
      targetLatitude = dto.targetLatitude;
      targetLongitude = dto.targetLongitude;
    } else if (dto.targetedLocation) {
      const parts = [
        (dto.targetedLocation as any).address,
        (dto.targetedLocation as any).city,
        (dto.targetedLocation as any).state,
        (dto.targetedLocation as any).country,
      ].filter(Boolean);

      const addressString = parts.join(', ') || 'India';

      const res = await this.geocoder.geocode(addressString);

      if (res.length === 0) {
        throw new BadRequestException('Unable to geocode the updated location.');
      }

      targetLatitude = res[0].latitude;
      targetLongitude = res[0].longitude;
    }

    updateData.targetLatitude = targetLatitude ?? null;
    updateData.targetLongitude = targetLongitude ?? null;
    updateData.targetRadiusKm = radiusKm;
  }

  // Optional: Update radius separately if provided directly
  if (dto.targetRadiusKm !== undefined) {
    updateData.targetRadiusKm = dto.targetRadiusKm;
  }

  // ==================== FINAL UPDATE ====================
  const updatedCampaign = await this.prisma.campaign.update({
    where: { campaignId },
    data: updateData,
  });

  return updatedCampaign;
}



  // async updateCampaign(
  //   campaignId: string,
  //   vendorId: string,
  //   dto: UpdateCampaignDto,
  //   files?: Express.Multer.File[],
  // ) {
  //   const campaign = await this.prisma.campaign.findUnique({
  //     where: { campaignId },
  //   });

  //   if (!campaign) {
  //     throw new NotFoundException('Campaign not found');
  //   }

  //   if (campaign.vendorId !== vendorId) {
  //     throw new ForbiddenException('You do not have access to this campaign');
  //   }

  //   const updateData: any = { ...dto };

  //   // Upload new media if provided
  //   if (files && files.length > 0) {
  //     // Delete old media from Cloudinary
  //     const oldMedia = campaign.mediaUrls as any[];
  //     await Promise.all(
  //       oldMedia.map((media) => this.cloudinary.deleteFile(media.publicId)),
  //     );

  //     // Upload new media
  //     const mediaUrls = await Promise.all(
  //       files.map(async (file) => {
  //         const result = await this.cloudinary.uploadFile(file);
  //         return {
  //           type: file.mimetype.startsWith('image/') ? 'image' : 'video',
  //           url: result.secure_url,
  //           publicId: result.public_id,
  //         };
  //       }),
  //     );
  //     updateData.mediaUrls = mediaUrls;
  //   }

  //   if (dto.startDate) {
  //     updateData.startDate = new Date(dto.startDate);
  //   }
  //   if (dto.endDate) {
  //     updateData.endDate = new Date(dto.endDate);
  //   }

  //   const updatedCampaign = await this.prisma.campaign.update({
  //     where: { campaignId },
  //     data: updateData,
  //   });

  //   return updatedCampaign;
  // }

  async pauseCampaign(campaignId: string, vendorId: string) {
    return this.updateCampaignStatus(campaignId, vendorId, 'PAUSED');
  }

  async resumeCampaign(campaignId: string, vendorId: string) {
    return this.updateCampaignStatus(campaignId, vendorId, 'RUNNING');
  }

  private async updateCampaignStatus(
    campaignId: string,
    vendorId: string,
    status: string,
  ) {
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

    // if (campaign.vendorId !== vendorId) {
    //   throw new ForbiddenException('You do not have access to this campaign');
    // }

    // Delete media from Cloudinary
    // if(campaign.mediaUrls){
    //   const media = campaign.mediaUrls as any[];
    //   await Promise.all(media.map((m) => this.cloudinary.deleteFile(m.publicId)));
    // }
    

    console.log(`Deleted media for campaign ${campaignId} from Cloudinary.`);
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

    const totalSpending = campaigns.reduce(
      (sum, c) => sum + c.currentSpending,
      0,
    );
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);

    return {
      campaigns,
      summary: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === 'RUNNING').length,
        pausedCampaigns: campaigns.filter((c) => c.status === 'PAUSED').length,
        completedCampaigns: campaigns.filter((c) => c.status === 'COMPLETED')
          .length,
        totalSpending,
        totalBudget,
        totalImpressions: campaigns.reduce(
          (sum, c) => sum + c.impressionCount,
          0,
        ),
        totalClicks: campaigns.reduce((sum, c) => sum + c.clickCount, 0),
        totalConversions: campaigns.reduce(
          (sum, c) => sum + c.conversionCount,
          0,
        ),
      },
    };
  }

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

  // async getTargetedCampaigns(
  //   user: { country?: string; state?: string; city?: string; age: number },
  //   skip = 0,
  //   take = 20,
  // ) {
  //   const locationFilters: any[] = [];
  //   if (user.country) {
  //     locationFilters.push({
  //       targetedLocation: { path: ['country'], equals: user.country },
  //     });
  //   }
  //   if (user.state) {
  //     locationFilters.push({
  //       targetedLocation: { path: ['state'], equals: user.state },
  //     });
  //   }
  //   if (user.city) {
  //     locationFilters.push({
  //       targetedLocation: { path: ['city'], equals: user.city },
  //     });
  //   }

  //   // Get all matching campaigns first
  //   const campaigns = await this.prisma.campaign.findMany({
  //     where: {
  //       status: 'RUNNING',
  //       targetedAgeMin: { lte: user.age },
  //       targetedAgeMax: { gte: user.age },
  //       ...(locationFilters.length ? { AND: locationFilters } : {}),
  //     },
  //   });

  //   // Shuffle campaigns randomly
  //   for (let i = campaigns.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [campaigns[i], campaigns[j]] = [campaigns[j], campaigns[i]];
  //   }

  //   // Return pagination
  //   return campaigns.slice(skip, skip + take);
  // }



async getUserFeed(
  userId: string,
  page: number = 1,
  limit: number = 20,
) {                  
  const skip = (page - 1) * limit;

  // Get user's current location
  const user = await this.prisma.user.findUnique({
    where: { userId },
    select: { latitude: true, longitude: true, dateOfBirth: true },
  });

  if (!user?.latitude || !user?.longitude) {
    throw new BadRequestException(
      'Your location is required to view the feed. Please active you GPS   location.',
    );
  }

  const userLat = user.latitude;
  const userLng = user.longitude;

  // Raw query using PostgreSQL point operator (<->) for distance
  // This is extremely fast and accurate
  const campaigns = await this.prisma.$queryRaw<
    Array<{
      campaignId: string;
      title: string;
      description: string;
      mediaUrls: any;
      targetLatitude: number;
      targetLongitude: number;
      targetRadiusKm: number;
      distanceKm: number;
      likeCount: number;
      dislikeCount: number;
      commentCount: number;
      shareCount: number;
      saveCount: number;
      vendor: {
        fullName: string;
        photo: string | null;
        followerCount: number;
      };
    }>
  >`
    SELECT 
      c."campaignId",
      c.title,
      c.description,
      c."mediaUrls",
      c."targetLatitude",
      c."targetLongitude",
      c."targetRadiusKm",
      (point(c."targetLongitude", c."targetLatitude") <-> point(${userLng}, ${userLat})) * 1.60934 AS "distanceKm",
      c."likeCount",
      c."dislikeCount",
      c."commentCount",
      c."shareCount",
      c."saveCount",
      json_build_object(
        'fullName', v."fullName",
        'photo', v.photo,
        'followerCount', v."followerCount"
      ) AS vendor
    FROM "campaigns" c
    INNER JOIN "users" v ON c."vendorId" = v."userId"
    WHERE c.status = 'RUNNING'
      AND c."startDate" <= NOW()
      AND c."endDate" >= NOW()
      AND c."targetLatitude" IS NOT NULL
      AND c."targetLongitude" IS NOT NULL
      -- User must be within campaign's radius
      AND (point(c."targetLongitude", c."targetLatitude") <-> point(${userLng}, ${userLat})) * 1.60934 <= c."targetRadiusKm"
    ORDER BY "distanceKm" ASC
    LIMIT ${limit} OFFSET ${skip}
  `;

  // Fetch engagement status for each campaign (like/dislike/save)
  const campaignIds = campaigns.map((c) => c.campaignId);

  const [likes, dislikes, saves] = await Promise.all([
    this.prisma.like.findMany({
      where: { campaignId: { in: campaignIds }, userId },
      select: { campaignId: true },
    }),
    this.prisma.dislike.findMany({
      where: { campaignId: { in: campaignIds }, userId },
      select: { campaignId: true },
    }),
    this.prisma.save.findMany({
      where: { campaignId: { in: campaignIds }, userId },
      select: { campaignId: true },
    }),
  ]);

  const likedSet = new Set(likes.map((l) => l.campaignId));
  const dislikedSet = new Set(dislikes.map((d) => d.campaignId));
  const savedSet = new Set(saves.map((s) => s.campaignId));

  // Combine data
  const feed = campaigns.map((campaign) => ({
    ...campaign,
    userEngagement: {
      liked: likedSet.has(campaign.campaignId),
      disliked: dislikedSet.has(campaign.campaignId),
      saved: savedSet.has(campaign.campaignId),
    },
    // Round distance for clean UI
    distanceKm: Math.round(campaign.distanceKm),
  }));

  return {
    data: feed,
    pagination: {
      page,
      limit,
      hasMore: feed.length === limit,
    },
  };
}

async searchCampaigns(
  userId: string,
  searchTerm: string,
  page: number = 1,
  limit: number = 20,
) {
  const skip = (page - 1) * limit;

  const normalizedTerm = searchTerm.trim();
  if (!normalizedTerm) {
    throw new BadRequestException('Search term cannot be empty');
  }

  // Fetch matching campaigns using Prisma (case-insensitive search)
  const campaigns = await this.prisma.campaign.findMany({
    where: {
      status: 'RUNNING',
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
      OR: [
        { title: { contains: normalizedTerm, mode: 'insensitive' } },
        { description: { contains: normalizedTerm, mode: 'insensitive' } },
      ],
    },
    select: {
      campaignId: true,
      title: true,
      description: true,
      mediaUrls: true,
      targetLatitude: true,
      targetLongitude: true,
      targetRadiusKm: true,
      likeCount: true,
      dislikeCount: true,
      commentCount: true,
      shareCount: true,
      saveCount: true,
      createdAt: true,
      vendor: {
        select: {
          fullName: true,
          photo: true,
          followerCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' }, // Basic fallback order from DB
    skip,
    take: limit + 10, // Fetch a few extra for accurate in-memory sorting
  });

  // In-memory relevance sorting (exact prefix > contains > newest)
  const termLower = normalizedTerm.toLowerCase();

  const sortedCampaigns = campaigns.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    // 1. Title starts with search term
    const aStartsWith = aTitle.startsWith(termLower) ? 0 : 1;
    const bStartsWith = bTitle.startsWith(termLower) ? 0 : 1;
    if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;

    // 2. Title contains search term
    const aContains = aTitle.includes(termLower) ? 0 : 1;
    const bContains = bTitle.includes(termLower) ? 0 : 1;
    if (aContains !== bContains) return aContains - bContains;

    // 3. Newest first
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Apply limit after sorting
  const limitedCampaigns = sortedCampaigns.slice(0, limit);

  const campaignIds = limitedCampaigns.map((c) => c.campaignId);

  // Fetch user engagements
  const [likes, dislikes, saves] = await Promise.all([
    this.prisma.like.findMany({
      where: { campaignId: { in: campaignIds }, userId },
      select: { campaignId: true },
    }),
    this.prisma.dislike.findMany({
      where: { campaignId: { in: campaignIds }, userId },
      select: { campaignId: true },
    }),
    this.prisma.save.findMany({
      where: { campaignId: { in: campaignIds }, userId },
      select: { campaignId: true },
    }),
  ]);

  const likedSet = new Set(likes.map((l) => l.campaignId));
  const dislikedSet = new Set(dislikes.map((d) => d.campaignId));
  const savedSet = new Set(saves.map((s) => s.campaignId));

  const feed = limitedCampaigns.map((campaign) => ({
    ...campaign,
    userEngagement: {
      liked: likedSet.has(campaign.campaignId),
      disliked: dislikedSet.has(campaign.campaignId),
      saved: savedSet.has(campaign.campaignId),
    },
  }));

  return {
    data: feed,
    pagination: {
      page,
      limit,
      hasMore: sortedCampaigns.length > limit, // true if we fetched extra and had more
    },
    searchTerm: normalizedTerm,
  };
}

}
