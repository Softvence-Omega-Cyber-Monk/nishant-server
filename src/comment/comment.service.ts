import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}
  async addComment(campaignId: string, userId: string, dto: CreateCommentDto) {
    // 1. Check campaign
    const campaign = await this.prisma.campaign.findUnique({
      where: { campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // 2. If replying, validate parent comment
    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { commentId: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }

      //  Prevent reply-to-reply (2-level only)
      if (parent.parentId) {
        throw new BadRequestException(
          'Replies are only allowed one level deep',
        );
      }

      // Parent must belong to same campaign
      if (parent.campaignId !== campaignId) {
        throw new BadRequestException(
          'Parent comment does not belong to this campaign',
        );
      }
    }

    // 3. Create comment + increment commentCount
    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          campaignId,
          userId,
          content: dto.content,
          parentId: dto.parentId ?? null,
        },
      }),
      this.prisma.campaign.update({
        where: { campaignId },
        data: {
          commentCount: { increment: 1 },
        },
      }),
    ]);

    return comment;
  }

  async getComments(campaignId: string) {
    return this.prisma.comment.findMany({
      where: {
        campaignId,
        parentId: null, // top-level only
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            photo: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                userId: true,
                fullName: true,
                photo: true,
              },
            },
          },
        },
      },
    });
  }
}
