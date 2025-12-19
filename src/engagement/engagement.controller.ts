// src/engagement/engagement.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Engagement')
@Controller('engagement')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EngagementController {
  constructor(private engagementService: EngagementService) {}

  // ==================== LIKE ====================

  @Post('campaigns/:campaignId/like')
  @ApiOperation({ 
    summary: 'Toggle like on campaign',
    description: 'Likes or unlikes a campaign. If already liked, removes the like. If not liked, adds a like. User can only have one like per campaign.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Like toggled successfully',
    schema: {
      example: {
        action: 'liked',
        liked: true,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async toggleLike(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleLike(campaignId, userId);
  }

  // ==================== DISLIKE ====================

  @Post('campaigns/:campaignId/dislike')
  @ApiOperation({ 
    summary: 'Toggle dislike on campaign',
    description: 'Dislikes or removes dislike from a campaign. User can only have one dislike per campaign.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dislike toggled successfully',
    schema: {
      example: {
        action: 'disliked',
        disliked: true,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async toggleDislike(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleDislike(campaignId, userId);
  }

  // ==================== LOVE ====================

  @Post('campaigns/:campaignId/love')
  @ApiOperation({ 
    summary: 'Toggle love on campaign',
    description: 'Loves or unloves a campaign. Love is a stronger positive reaction than like. User can only have one love per campaign.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Love toggled successfully',
    schema: {
      example: {
        action: 'loved',
        loved: true,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async toggleLove(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleLove(campaignId, userId);
  }

  // ==================== SHARE ====================

  @Post('campaigns/:campaignId/share')
  @ApiOperation({ 
    summary: 'Share campaign',
    description: 'Records a campaign share event. Increments campaign share count. Can be called multiple times by same user.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Campaign shared successfully',
    schema: {
      example: {
        message: 'Campaign shared successfully',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async shareCampaign(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.shareCampaign(campaignId, userId);
  }

  // ==================== SAVE ====================

  @Post('campaigns/:campaignId/save')
  @ApiOperation({ 
    summary: 'Toggle save on campaign',
    description: 'Saves or unsaves a campaign for later viewing. User can only have one save per campaign.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Save toggled successfully',
    schema: {
      example: {
        action: 'saved',
        saved: true,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async toggleSave(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleSave(campaignId, userId);
  }

  // ==================== IMPRESSION ====================

  @Post('campaigns/:campaignId/impression')
  @ApiOperation({ 
    summary: 'Record impression',
    description: 'Records when a campaign is viewed/displayed. Only one impression per user per 24 hours to avoid duplicates. Used for analytics and CTR calculation.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        location: {
          type: 'object',
          properties: {
            country: { type: 'string', example: 'India' },
            state: { type: 'string', example: 'Maharashtra' },
            city: { type: 'string', example: 'Mumbai' },
          },
        },
        deviceType: { type: 'string', example: 'mobile', enum: ['mobile', 'tablet', 'desktop'] },
      },
    },
    examples: {
      example1: {
        summary: 'With location data',
        value: {
          location: { country: 'India', state: 'Maharashtra', city: 'Mumbai' },
          deviceType: 'mobile',
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Impression recorded',
    schema: {
      example: {
        message: 'Impression recorded',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async recordImpression(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: { location?: any; deviceType?: string },
  ) {
    return this.engagementService.recordImpression(campaignId, userId, body);
  }

  // ==================== CLICK ====================

  @Post('campaigns/:campaignId/click')
  @ApiOperation({ 
    summary: 'Record click',
    description: 'Records when a user clicks on a campaign (e.g., clicking CTA button). Deducts from campaign budget ($0.50 per click). Updates CTR automatically.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        location: {
          type: 'object',
          properties: {
            country: { type: 'string', example: 'India' },
            state: { type: 'string', example: 'Maharashtra' },
            city: { type: 'string', example: 'Mumbai' },
          },
        },
        deviceType: { type: 'string', example: 'mobile', enum: ['mobile', 'tablet', 'desktop'] },
      },
    },
    examples: {
      example1: {
        summary: 'With location data',
        value: {
          location: { country: 'India', state: 'Maharashtra', city: 'Mumbai' },
          deviceType: 'mobile',
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Click recorded and budget deducted',
    schema: {
      example: {
        message: 'Click recorded',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async recordClick(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: { location?: any; deviceType?: string },
  ) {
    return this.engagementService.recordClick(campaignId, userId, body);
  }

  // ==================== CONVERSION ====================

  @Post('campaigns/:campaignId/conversion')
  @ApiOperation({ 
    summary: 'Record conversion',
    description: 'Records a conversion event (purchase, signup, download, etc.). Sends notification to vendor. Used for measuring campaign ROI.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 999.99, description: 'Conversion value/amount' },
        type: { type: 'string', example: 'purchase', description: 'Type of conversion' },
        metadata: { 
          type: 'object', 
          example: { productId: 'prod123', orderId: 'order456' },
          description: 'Additional conversion data',
        },
      },
    },
    examples: {
      purchase: {
        summary: 'Purchase conversion',
        value: {
          amount: 999.99,
          type: 'purchase',
          metadata: { productId: 'prod123', orderId: 'order456' },
        },
      },
      signup: {
        summary: 'Signup conversion',
        value: {
          type: 'signup',
          metadata: { plan: 'premium' },
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Conversion recorded',
    schema: {
      example: {
        message: 'Conversion recorded',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Campaign not found' })
  async recordConversion(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: { amount?: number; type?: string; metadata?: any },
  ) {
    return this.engagementService.recordConversion(campaignId, userId, body);
  }

  // ==================== ENGAGEMENT STATUS ====================

  @Get('campaigns/:campaignId/status')
  @ApiOperation({ 
    summary: 'Get user engagement status',
    description: 'Returns current user\'s engagement status with a campaign (liked, disliked, loved, saved). Used to show correct UI state.'
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns user engagement status',
    schema: {
      example: {
        liked: true,
        disliked: false,
        loved: false,
        saved: true,
      },
    },
  })
  async getEngagementStatus(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.getUserEngagementStatus(campaignId, userId);
  }
}