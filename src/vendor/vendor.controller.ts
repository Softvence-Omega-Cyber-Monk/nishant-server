// src/vendor/vendor.controller.ts
import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseIntPipe,
  HttpStatus,
  Delete,
  ParseUUIDPipe,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { NotificationSettingsService } from '../notification/notification-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UpdateNotificationSettingsDto } from 'src/notification/dto/update-notification-settings.dto';

@ApiTags('Vendor')
@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class VendorController {
  constructor(
    private vendorService: VendorService,
    private notificationSettingsService: NotificationSettingsService,
  ) {}

  // ==================== PROFILE MANAGEMENT ====================

  @Delete('delete-vendor')  // The DELETE route is "/vendor/delete-vendor"
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete vendor profile',
    description: 'Deletes the vendor profile and associated data.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden: Only vendors can be deleted',
  })
  async deleteProfile(
    @Query('vendorId') vendorId: string
  ) {
    console.log('deleteVendorProfile route hit');
    return this.vendorService.deleteVendorProfile(vendorId);
  }



  @Get('profile')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Get vendor profile',
    description:
      'Retrieves complete vendor profile including follower count, description, category, contact info, and social media links.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns vendor profile',
    schema: {
      example: {
        userId: 'uuid',
        fullName: 'John Doe',
        email: 'vendor@example.com',
        phone: '+1234567890',
        photo: 'https://cloudinary.com/photo.jpg',
        description: 'Leading tech vendor',
        category: 'Technology',
        location: 'Mumbai, India',
        followerCount: 1250,
        instagramUrl: 'https://instagram.com/vendor',
        facebookUrl: 'https://facebook.com/vendor',
        websiteUrl: 'https://vendor.com',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  async getProfile(@GetUser('userId') userId: string) {
    return this.vendorService.getVendorProfile(userId);
  }

  @Put('profile')
  @Roles('VENDOR')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update vendor profile',
    description:
      'Updates vendor profile information including name, description, category, contact details, social links, and profile photo.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'John Doe' },
        description: {
          type: 'string',
          example: 'Leading technology vendor in Mumbai',
        },
        category: { type: 'string', example: 'Technology' },
        phone: { type: 'string', example: '+1234567890' },
        location: { type: 'string', example: 'Mumbai, Maharashtra, India' },
        email: { type: 'string', example: 'vendor@example.com' },
        instagramUrl: {
          type: 'string',
          example: 'https://instagram.com/vendor',
        },
        facebookUrl: { type: 'string', example: 'https://facebook.com/vendor' },
        websiteUrl: { type: 'string', example: 'https://vendor.com' },
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Profile photo (jpg, png, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  async updateProfile(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateVendorProfileDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.vendorService.updateVendorProfile(userId, dto, photo);
  }


  

  // ==================== TRANSACTION MANAGEMENT ====================

  @Get('transactions')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Get transaction history',
    description:
      'Retrieves paginated list of all transactions with campaign details, total spending, and transaction summary.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated transactions',
    schema: {
      example: {
        transactions: [
          {
            transactionId: 'uuid',
            amount: 10000,
            type: 'CAMPAIGN_PAYMENT',
            status: 'SUCCESS',
            razorpayOrderId: 'order_id',
            razorpayPaymentId: 'pay_id',
            createdAt: '2024-12-01T00:00:00Z',
            campaign: {
              campaignId: 'uuid',
              title: 'Summer Sale',
              status: 'RUNNING',
              budget: 10000,
              startDate: '2024-12-01T00:00:00Z',
              endDate: '2024-12-31T00:00:00Z',
              createdAt: '2024-12-01T00:00:00Z',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 25,
          totalPages: 3,
        },
        summary: {
          totalTransactions: 25,
          totalSpending: 250000,
        },
      },
    },
  })
  async getTransactions(
    @GetUser('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.vendorService.getTransactionHistory(userId, page, limit);
  }

  @Get('transactions/stats')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Get transaction statistics',
    description:
      'Retrieves comprehensive transaction statistics including total spending, refunds, monthly breakdown, and success/failure counts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns transaction statistics',
    schema: {
      example: {
        totalTransactions: 25,
        totalSpending: 250000,
        totalRefunds: 5000,
        successfulTransactions: 23,
        failedTransactions: 2,
        monthlySpending: {
          '2024-12': 50000,
          '2024-11': 75000,
          '2024-10': 125000,
        },
      },
    },
  })
  async getTransactionStats(@GetUser('userId') userId: string) {
    return this.vendorService.getTransactionStats(userId);
  }

  // ==================== NOTIFICATION SETTINGS ====================

  @Get('notification-settings')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Get notification settings',
    description:
      'Retrieves vendor notification preferences for campaign performance, budget alerts, payments, and live updates.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns notification settings',
    schema: {
      example: {
        settingsId: 'uuid',
        userId: 'uuid',
        campaignPerformanceUpdates: true,
        lowBudgetAlert: true,
        paymentTransactionUpdates: true,
        liveCampaignUpdates: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
      },
    },
  })
  async getNotificationSettings(@GetUser('userId') userId: string) {
    return this.notificationSettingsService.getNotificationSettings(userId);
  }

  @Put('notification-settings')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Update notification settings',
    description:
      'Updates vendor notification preferences. Controls which types of notifications vendor wants to receive.',
  })
  @ApiBody({
    type: UpdateNotificationSettingsDto,
    examples: {
      example1: {
        summary: 'Enable all notifications',
        value: {
          campaignPerformanceUpdates: true,
          lowBudgetAlert: true,
          paymentTransactionUpdates: true,
          liveCampaignUpdates: true,
        },
      },
      example2: {
        summary: 'Disable performance updates',
        value: {
          campaignPerformanceUpdates: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification settings updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateNotificationSettings(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationSettingsService.updateNotificationSettings(
      userId,
      dto,
    );
  }
}
