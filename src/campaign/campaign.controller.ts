// src/campaign/campaign.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaymentVerificationDto } from './dto/payment-verification.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Post()
  @Roles('VENDOR')
  @UseInterceptors(FilesInterceptor('mediaFiles', 10))
  @ApiOperation({ 
    summary: 'Create a new campaign',
    description: 'Creates a new advertising campaign with media files and generates a Razorpay payment order. Only vendors can create campaigns.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Campaign creation data with media files',
    schema: {
      type: 'object',
      required: ['title', 'description', 'targetedLocation', 'budget', 'startDate', 'endDate', 'mediaFiles'],
      properties: {
        title: { type: 'string', example: 'Summer Sale Campaign' },
        description: { type: 'string', example: 'Promotional campaign for summer collection' },
        targetedLocation: {
          type: 'object',
          properties: {
            country: { type: 'string', example: 'Bangladesh' },
            state: { type: 'string', example: 'Dhaka Division' },
            city: { type: 'string', example: 'Dhaka' },
            radius: { type: 'number', example: 10 }
          }
        },
        targetedAgeMin: { type: 'number', minimum: 13, maximum: 100, example: 18 },
        targetedAgeMax: { type: 'number', minimum: 13, maximum: 100, example: 45 },
        budget: { type: 'number', minimum: 100, example: 5000 },
        startDate: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
        endDate: { type: 'string', format: 'date-time', example: '2025-01-31T23:59:59Z' },
        mediaFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload up to 10 image/video files (max 50MB each)'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Campaign created successfully with payment order',
    schema: {
      type: 'object',
      properties: {
        campaign: {
          type: 'object',
          properties: {
            campaignId: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['PAUSED'] },
            razorpayOrderId: { type: 'string' }
          }
        },
        order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or file validation failed' })
  @ApiResponse({ status: 403, description: 'Only vendors can create campaigns' })
  async createCampaign(
    @GetUser('userId') userId: string,
    @Body() dto: CreateCampaignDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ 
            fileType: /(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|avi|mov|wmv))/,
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.campaignService.createCampaign(userId, dto, files);
  }

  @Post('verify-payment')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Verify payment and activate campaign',
    description: 'Verifies the Razorpay payment signature and activates the campaign'
  })
  @ApiBody({ type: PaymentVerificationDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment verified and campaign activated successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid payment signature' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async verifyPayment(@Body() dto: PaymentVerificationDto) {
    return this.campaignService.verifyPaymentAndActivateCampaign(dto);
  }

  @Get('my-campaigns')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Get vendor campaigns',
    description: 'Retrieves all campaigns created by the authenticated vendor'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['RUNNING', 'PAUSED', 'COMPLETED'],
    description: 'Filter campaigns by status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of campaigns retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          campaignId: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string' },
          budget: { type: 'number' },
          impressionCount: { type: 'number' },
          clickCount: { type: 'number' },
          ctr: { type: 'number' }
        }
      }
    }
  })
  async getVendorCampaigns(
    @GetUser('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.campaignService.getVendorCampaigns(userId, status);
  }

  @Get('stats')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Get campaign statistics',
    description: 'Retrieves comprehensive statistics for all vendor campaigns'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Campaign statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        campaigns: { type: 'array' },
        summary: {
          type: 'object',
          properties: {
            totalCampaigns: { type: 'number' },
            activeCampaigns: { type: 'number' },
            totalSpending: { type: 'number' },
            totalImpressions: { type: 'number' },
            totalClicks: { type: 'number' }
          }
        }
      }
    }
  })
  async getCampaignStats(@GetUser('userId') userId: string) {
    return this.campaignService.getCampaignStats(userId);
  }

  @Get(':campaignId')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Get campaign details',
    description: 'Retrieves detailed information about a specific campaign including comments and location stats'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Campaign details retrieved successfully'
  })
  @ApiResponse({ status: 403, description: 'You do not have access to this campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignDetails(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.getCampaignDetails(campaignId, userId);
  }

  @Put(':campaignId')
  @Roles('VENDOR')
  @UseInterceptors(FilesInterceptor('mediaFiles', 10))
  @ApiOperation({ 
    summary: 'Update campaign',
    description: 'Updates campaign details and optionally replaces media files'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiBody({
    description: 'Campaign update data',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        targetedLocation: { type: 'object' },
        targetedAgeMin: { type: 'number' },
        targetedAgeMax: { type: 'number' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        mediaFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @ApiResponse({ status: 403, description: 'You do not have access to this campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async updateCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateCampaignDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.campaignService.updateCampaign(campaignId, userId, dto, files);
  }

  @Put(':campaignId/pause')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Pause campaign',
    description: 'Pauses a running campaign to stop ad delivery'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully' })
  @ApiResponse({ status: 403, description: 'You do not have access to this campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async pauseCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.pauseCampaign(campaignId, userId);
  }

  @Put(':campaignId/resume')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Resume campaign',
    description: 'Resumes a paused campaign to restart ad delivery'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({ status: 200, description: 'Campaign resumed successfully' })
  @ApiResponse({ status: 403, description: 'You do not have access to this campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async resumeCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.resumeCampaign(campaignId, userId);
  }

  @Delete(':campaignId')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Delete campaign',
    description: 'Permanently deletes a campaign and all associated media files'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Campaign deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Campaign deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'You do not have access to this campaign' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async deleteCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.deleteCampaign(campaignId, userId);
  }

  @Post(':campaignId/comments')
  @Roles('VENDOR', 'USER')
  @ApiOperation({ 
    summary: 'Add comment to campaign',
    description: 'Adds a comment or reply to a campaign. Available to both vendors and users.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign ID' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Comment added successfully',
    schema: {
      type: 'object',
      properties: {
        commentId: { type: 'string' },
        content: { type: 'string' },
        userId: { type: 'string' },
        campaignId: { type: 'string' },
        parentId: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async addComment(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.campaignService.addComment(campaignId, userId, dto);
  }
}