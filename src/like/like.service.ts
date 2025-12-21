import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}
  async toggleLike(campaignId: string, userId: string) {
    // 1. Check if campaign exists
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // 2. Check if user already liked
    const existingLike = await this.prisma.like.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId,
        },
      },
    });

    // 3. If liked → UNLIKE
    if (existingLike) {
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: { likeId: existingLike.likeId },
        }),
        this.prisma.campaign.update({
          where: { campaignId },
          data: {
            likeCount: { decrement: 1 },
          },
        }),
      ]);

      return {
        liked: false,
        message: 'Campaign unliked',
      };
    }

    // 4. If not liked → LIKE
    await this.prisma.$transaction([
      this.prisma.like.create({
        data: {
          campaignId,
          userId,
        },
      }),
      this.prisma.campaign.update({
        where: { campaignId },
        data: {
          likeCount: { increment: 1 },
        },
      }),
    ]);

    return {
      liked: true,
      message: 'Campaign liked',
    };
  }
  async toggleDisLike(campaignId: string, userId: string) {
    // 1. Check if campaign exists
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // 2. Check if user already liked
    const existingDisLike = await this.prisma.dislike.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId,
        },
      },
    });

    // 3. If liked → UNLIKE
    if (existingDisLike) {
      await this.prisma.$transaction([
        this.prisma.dislike.delete({
          where: { dislikeId: existingDisLike.dislikeId },
        }),
        this.prisma.campaign.update({
          where: { campaignId },
          data: {
            dislikeCount: { decrement: 1 },
          },
        }),
      ]);

      return {
        dislike: false,
        message: 'Campaign undisliked',
      };
    }

    // 4. If not liked → LIKE
    await this.prisma.$transaction([
      this.prisma.dislike.create({
        data: {
          campaignId,
          userId,
        },
      }),
      this.prisma.campaign.update({
        where: { campaignId },
        data: {
          dislikeCount: { increment: 1 },
        },
      }),
    ]);

    return {
      disliked: true,
      message: 'Campaign disliked',
    };
  }
  async toggleLove(campaignId: string, userId: string) {
    // 1. Check if campaign exists
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // 2. Check if user already love
    const existingDisLike = await this.prisma.love.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId,
        },
      },
    });

    // 3. If loved → HATE
    if (existingDisLike) {
      await this.prisma.$transaction([
        this.prisma.love.delete({
          where: { loveId: existingDisLike.loveId },
        }),
        this.prisma.campaign.update({
          where: { campaignId },
          data: {
            loveCount: { decrement: 1 },
          },
        }),
      ]);

      return {
        love: false,
        message: 'Campaign Hate',
      };
    }

    // 4. If not loved → LOVE
    await this.prisma.$transaction([
      this.prisma.love.create({
        data: {
          campaignId,
          userId,
        },
      }),
      this.prisma.campaign.update({
        where: { campaignId },
        data: {
          loveCount: { increment: 1 },
        },
      }),
    ]);

    return {
      love: true,
      message: 'Campaign loved',
    };
  }
}
