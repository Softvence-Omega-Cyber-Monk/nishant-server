import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
@Injectable()
export class VendorService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async getVendorProfile(vendorId: string) {
    const vendor = await this.prisma.user.findUnique({
      where: { userId: vendorId },
      select: {
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        photo: true,
        description: true,
        category: true,
        location: true,
        followerCount: true,
        instagramUrl: true,
        facebookUrl: true,
        websiteUrl: true,
        createdAt: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async updateVendorProfile(
    vendorId: string,
    dto: UpdateVendorProfileDto,
    photo?: Express.Multer.File,
  ) {
    const vendor = await this.prisma.user.findUnique({
      where: { userId: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.role !== 'VENDOR') {
      throw new ForbiddenException('Only vendors can update vendor profile');
    }

    const updateData: any = { ...dto };

    // Upload photo if provided
    if (photo) {
      // Delete old photo from Cloudinary if exists
      if (vendor.photo) {
        const publicId = this.extractPublicId(vendor.photo);
        await this.cloudinary.deleteFile(publicId);
      }

      const result = await this.cloudinary.uploadFile(photo);
      updateData.photo = result.secure_url;
    }

    const updatedVendor = await this.prisma.user.update({
      where: { userId: vendorId },
      data: updateData,
      select: {
        userId: true,
        fullName: true,
        email: true,
        phone: true,
        photo: true,
        description: true,
        category: true,
        location: true,
        followerCount: true,
        instagramUrl: true,
        facebookUrl: true,
        websiteUrl: true,
      },
    });

    return updatedVendor;
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }

  async getTransactionHistory(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId: vendorId },
        include: {
          campaign: {
            select: {
              campaignId: true,
              title: true,
              status: true,
              budget: true,
              startDate: true,
              endDate: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({
        where: { userId: vendorId },
      }),
    ]);

    const totalSpending = await this.prisma.transaction.aggregate({
      where: {
        userId: vendorId,
        type: 'CAMPAIGN_PAYMENT',
        status: 'SUCCESS',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalTransactions: totalCount,
        totalSpending: totalSpending._sum.amount || 0,
      },
    };
  }

  async getTransactionStats(vendorId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId: vendorId },
      select: {
        transactionId: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    const totalSpending = transactions
      .filter((t) => t.type === 'CAMPAIGN_PAYMENT' && t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunds = transactions
      .filter((t) => t.type === 'REFUND' && t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by month for chart data
    const monthlyData: { [key: string]: number } = {};
    transactions.forEach((t) => {
      if (t.type === 'CAMPAIGN_PAYMENT' && t.status === 'SUCCESS') {
        const month = t.createdAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + t.amount;
      }
    });

    return {
      totalTransactions: transactions.length,
      totalSpending,
      totalRefunds,
      successfulTransactions: transactions.filter((t) => t.status === 'SUCCESS')
        .length,
      failedTransactions: transactions.filter((t) => t.status === 'FAILED')
        .length,
      monthlySpending: monthlyData,
    };
  }
}
