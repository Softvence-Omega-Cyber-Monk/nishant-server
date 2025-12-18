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
  DefaultValuePipe,
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
@ApiBearerAuth()
@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class VendorController {
  constructor(
    private vendorService: VendorService,
    private notificationSettingsService: NotificationSettingsService,
  ) {}

  // ==================== Profile Management ====================
  
  @Get('profile')
  @ApiOperation({ 
    summary: 'Get vendor profile',
    description: 'Retrieves the authenticated vendor\'s profile information including business details and social media links'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vendor profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user_abc123' },
        fullName: { type: 'string', example: 'TechStore Bangladesh' },
        email: { type: 'string', example: 'vendor@techstore.com' },
        phone: { type: 'string', example: '+8801712345678' },
        photo: { type: 'string', example: 'https://cloudinary.com/photo.jpg' },
        description: { type: 'string', example: 'Leading electronics retailer in Dhaka' },
        category: { type: 'string', example: 'Electronics' },
        location: { type: 'string', example: 'Dhaka, Bangladesh' },
        followerCount: { type: 'number', example: 1250 },
        instagramUrl: { type: 'string', example: 'https://instagram.com/techstore' },
        facebookUrl: { type: 'string', example: 'https://facebook.com/techstore' },
        websiteUrl: { type: 'string', example: 'https://techstore.com' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async getProfile(@GetUser('userId') userId: string) {
    return this.vendorService.getVendorProfile(userId);
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ 
    summary: 'Update vendor profile',
    description: 'Updates vendor profile information including photo upload. Old photo is automatically deleted from cloud storage.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Vendor profile update data',
    schema: {
      type: 'object',
      properties: {
        fullName: { 
          type: 'string', 
          example: 'TechStore Bangladesh',
          description: 'Business or vendor name'
        },
        description: { 
          type: 'string', 
          example: 'Leading electronics retailer specializing in smartphones and laptops',
          maxLength: 500
        },
        category: { 
          type: 'string', 
          example: 'Electronics',
          description: 'Business category'
        },
        phone: { 
          type: 'string', 
          example: '+8801712345678',
          pattern: '^\\+?[1-9]\\d{1,14}$'
        },
        location: { 
          type: 'string', 
          example: 'Gulshan, Dhaka, Bangladesh'
        },
        email: { 
          type: 'string', 
          format: 'email',
          example: 'contact@techstore.com'
        },
        instagramUrl: { 
          type: 'string', 
          format: 'uri',
          example: 'https://instagram.com/techstore'
        },
        facebookUrl: { 
          type: 'string', 
          format: 'uri',
          example: 'https://facebook.com/techstore'
        },
        websiteUrl: { 
          type: 'string', 
          format: 'uri',
          example: 'https://techstore.com'
        },
        photo: { 
          type: 'string', 
          format: 'binary',
          description: 'Profile photo file (JPEG, PNG, WebP)'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        fullName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        photo: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        location: { type: 'string' },
        followerCount: { type: 'number' },
        instagramUrl: { type: 'string' },
        facebookUrl: { type: 'string' },
        websiteUrl: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Only vendors can update vendor profile' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async updateProfile(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateVendorProfileDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.vendorService.updateVendorProfile(userId, dto, photo);
  }

  // ==================== Transaction Management ====================
  
  @Get('transactions')
  @ApiOperation({ 
    summary: 'Get transaction history',
    description: 'Retrieves paginated transaction history for the vendor including campaign payments and refunds'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    example: 1,
    description: 'Page number (default: 1)'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    example: 10,
    description: 'Items per page (default: 10)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction history retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transactionId: { type: 'string' },
              amount: { type: 'number' },
              type: { type: 'string', enum: ['CAMPAIGN_PAYMENT', 'REFUND'] },
              status: { type: 'string', enum: ['SUCCESS', 'FAILED', 'PENDING'] },
              description: { type: 'string' },
              razorpayOrderId: { type: 'string' },
              razorpayPaymentId: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              campaign: {
                type: 'object',
                properties: {
                  campaignId: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                  budget: { type: 'number' }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalCount: { type: 'number', example: 45 },
            totalPages: { type: 'number', example: 5 }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalTransactions: { type: 'number', example: 45 },
            totalSpending: { type: 'number', example: 125000 }
          }
        }
      }
    }
  })
  async getTransactions(
    @GetUser('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.vendorService.getTransactionHistory(userId, page, limit);
  }

  @Get('transactions/stats')
  @ApiOperation({ 
    summary: 'Get transaction statistics',
    description: 'Retrieves comprehensive transaction statistics including monthly spending trends and success rates'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalTransactions: { 
          type: 'number', 
          example: 45,
          description: 'Total number of transactions'
        },
        totalSpending: { 
          type: 'number', 
          example: 125000,
          description: 'Total amount spent on campaigns (INR)'
        },
        totalRefunds: { 
          type: 'number', 
          example: 5000,
          description: 'Total refund amount (INR)'
        },
        successfulTransactions: { 
          type: 'number', 
          example: 42,
          description: 'Number of successful transactions'
        },
        failedTransactions: { 
          type: 'number', 
          example: 3,
          description: 'Number of failed transactions'
        },
        monthlySpending: {
          type: 'object',
          example: {
            '2024-11': 35000,
            '2024-12': 48000,
            '2025-01': 42000
          },
          description: 'Monthly spending breakdown (YYYY-MM format)'
        }
      }
    }
  })
  async getTransactionStats(@GetUser('userId') userId: string) {
    return this.vendorService.getTransactionStats(userId);
  }

  // ==================== Notification Settings ====================
  
  @Get('notification-settings')
  @ApiOperation({ 
    summary: 'Get notification settings',
    description: 'Retrieves the vendor\'s notification preferences for various event types'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        campaignPerformanceUpdates: { 
          type: 'boolean', 
          example: true,
          description: 'Daily campaign performance summaries'
        },
        liveCampaignUpdates: { 
          type: 'boolean', 
          example: true,
          description: 'Real-time campaign status changes'
        },
        lowBudgetAlert: { 
          type: 'boolean', 
          example: true,
          description: 'Alert when campaign budget is below 20%'
        },
        newCommentNotification: { 
          type: 'boolean', 
          example: true,
          description: 'Notifications for new comments on campaigns'
        },
        newFollowerNotification: { 
          type: 'boolean', 
          example: false,
          description: 'Notifications for new followers'
        },
        emailNotifications: { 
          type: 'boolean', 
          example: true,
          description: 'Receive notifications via email'
        },
        pushNotifications: { 
          type: 'boolean', 
          example: true,
          description: 'Receive push notifications on mobile'
        }
      }
    }
  })
  async getNotificationSettings(@GetUser('userId') userId: string) {
    return this.notificationSettingsService.getNotificationSettings(userId);
  }

  @Put('notification-settings')
  @ApiOperation({ 
    summary: 'Update notification settings',
    description: 'Updates the vendor\'s notification preferences. Only provided fields will be updated.'
  })
  @ApiBody({ 
    type: UpdateNotificationSettingsDto,
    description: 'Notification settings to update',
    examples: {
      'disable-all': {
        summary: 'Disable all notifications',
        value: {
          campaignPerformanceUpdates: false,
          liveCampaignUpdates: false,
          lowBudgetAlert: false,
          newCommentNotification: false,
          newFollowerNotification: false,
          emailNotifications: false,
          pushNotifications: false
        }
      },
      'critical-only': {
        summary: 'Only critical alerts',
        value: {
          lowBudgetAlert: true,
          liveCampaignUpdates: true,
          emailNotifications: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notification settings updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string', 
          example: 'Notification settings updated successfully' 
        },
        settings: {
          type: 'object',
          properties: {
            campaignPerformanceUpdates: { type: 'boolean' },
            liveCampaignUpdates: { type: 'boolean' },
            lowBudgetAlert: { type: 'boolean' },
            newCommentNotification: { type: 'boolean' },
            newFollowerNotification: { type: 'boolean' },
            emailNotifications: { type: 'boolean' },
            pushNotifications: { type: 'boolean' }
          }
        }
      }
    }
  })
  async updateNotificationSettings(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationSettingsService.updateNotificationSettings(userId, dto);
  }
}