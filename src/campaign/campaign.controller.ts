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
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaymentVerificationDto } from './dto/payment-verification.dto';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Post()
@Roles('VENDOR')
@UseInterceptors(FilesInterceptor('mediaFiles', 10))
@ApiConsumes('multipart/form-data')
async createCampaign(
  @GetUser('userId') userId: string,
  @Body() body: any, // Accept raw body
  @UploadedFiles(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
        new FileTypeValidator({ 
          fileType: /(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|avi|mov|wmv))/,
        }),
      ],
    }),
  )
  files: Express.Multer.File[],
) {
  // Validate files exist
  if (!files || files.length === 0) {
    throw new BadRequestException('At least one media file is required');
  }

  // Parse targetedLocation from JSON string
  let targetedLocation;
  try {
    targetedLocation = typeof body.targetedLocation === 'string' 
      ? JSON.parse(body.targetedLocation) 
      : body.targetedLocation;
  } catch (error) {
    throw new BadRequestException('Invalid targetedLocation format');
  }

  // Convert numeric strings to numbers
  const dto: CreateCampaignDto = {
    ...body,
    targetedLocation,
    targetedAgeMin: body.targetedAgeMin ? Number(body.targetedAgeMin) : undefined,
    targetedAgeMax: body.targetedAgeMax ? Number(body.targetedAgeMax) : undefined,
    budget: Number(body.budget),
    mediaFiles: files,
  };

  return this.campaignService.createCampaign(userId, dto, files);
}

  @Post('verify-payment')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Verify Razorpay payment',
    description: 'Verifies Razorpay payment signature and activates the campaign. Call this after successful payment on frontend.'
  })
  @ApiBody({
    type: PaymentVerificationDto,
    examples: {
      example1: {
        summary: 'Payment verification',
        value: {
          razorpayOrderId: 'order_JZg8h2E3HGHD6h',
          razorpayPaymentId: 'pay_JZg8h2E3HGHD6h',
          razorpaySignature: 'generated_signature_hash',
          campaignId: 'uuid-campaign-id',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment verified and campaign activated' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid payment signature' })
  async verifyPayment(@Body() dto: PaymentVerificationDto) {
    return this.campaignService.verifyPaymentAndActivateCampaign(dto);
  }

  @Get('my-campaigns')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Get vendor campaigns',
    description: 'Retrieves all campaigns created by the authenticated vendor with engagement statistics.'
  })
  @ApiQuery({ name: 'status', required: false, enum: ['RUNNING', 'PAUSED', 'COMPLETED'], description: 'Filter by campaign status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns list of campaigns with stats' })
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
    description: 'Retrieves comprehensive statistics for all campaigns including total spending, impressions, clicks, conversions.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns aggregated campaign statistics',
    schema: {
      example: {
        campaigns: [],
        summary: {
          totalCampaigns: 5,
          activeCampaigns: 2,
          pausedCampaigns: 1,
          completedCampaigns: 2,
          totalSpending: 25000,
          totalBudget: 50000,
          totalImpressions: 100000,
          totalClicks: 5000,
          totalConversions: 250,
        },
      },
    },
  })
  async getCampaignStats(@GetUser('userId') userId: string) {
    return this.campaignService.getCampaignStats(userId);
  }

  @Get(':campaignId')
  @Roles('VENDOR')
  @ApiOperation({ 
    summary: 'Get campaign details',
    description: 'Retrieves detailed information about a specific campaign including all comments, engagement metrics, and location-based statistics.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns detailed campaign information' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this campaign' })
  async getCampaignDetails(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.getCampaignDetails(campaignId, userId);
  }

  @Put(':campaignId')
  @Roles('VENDOR')
  @UseInterceptors(FilesInterceptor('mediaFiles', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Update campaign',
    description: 'Updates campaign details. Can update text fields, dates, targeting, and replace media files.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        mediaFiles: { type: 'array', items: { type: 'string', format: 'binary' } },
        targetedLocation: { type: 'object' },
        targetedAgeMin: { type: 'number' },
        targetedAgeMax: { type: 'number' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['RUNNING', 'PAUSED', 'COMPLETED'] },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this campaign' })
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
    description: 'Pauses a running campaign. No impressions or clicks will be recorded while paused.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign paused successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
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
    description: 'Resumes a paused campaign. Campaign will start recording impressions and clicks again.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign resumed successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
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
    description: 'Permanently deletes a campaign and all associated media files from Cloudinary.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied to this campaign' })
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
    description: 'Adds a comment to a campaign. Can also reply to existing comments by providing parentId.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiBody({
    type: CreateCommentDto,
    examples: {
      newComment: {
        summary: 'New comment',
        value: { content: 'Great campaign!' },
      },
      reply: {
        summary: 'Reply to comment',
        value: { content: 'Thank you!', parentId: 'parent-comment-uuid' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Comment added successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async addComment(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.campaignService.addComment(campaignId, userId, dto);
  }
}