import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
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
import { RecordClickDto, RecordConversionDto, RecordImpressionDto } from './dto/engagement.dto';

@ApiTags('Engagement')
@ApiBearerAuth()
@Controller('engagement')
@UseGuards(JwtAuthGuard)
export class EngagementController {
  constructor(private engagementService: EngagementService) {}

  @Post('campaigns/:campaignId/like')
  @ApiOperation({ 
    summary: 'Toggle like on campaign',
    description: 'Likes or unlikes a campaign. If already liked, removes the like. If not liked, adds a like.'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Like toggled successfully',
    schema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['liked', 'unliked'],
          example: 'liked'
        },
        liked: { 
          type: 'boolean',
          example: true
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async toggleLike(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleLike(campaignId, userId);
  }

  @Post('campaigns/:campaignId/dislike')
  @ApiOperation({ 
    summary: 'Toggle dislike on campaign',
    description: 'Dislikes or removes dislike from a campaign. Toggle behavior similar to like.'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Dislike toggled successfully',
    schema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['disliked', 'removed_dislike'],
          example: 'disliked'
        },
        disliked: { 
          type: 'boolean',
          example: true
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async toggleDislike(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleDislike(campaignId, userId);
  }

  @Post('campaigns/:campaignId/love')
  @ApiOperation({ 
    summary: 'Toggle love on campaign',
    description: 'Adds or removes a love reaction to a campaign. Love is a stronger positive reaction than like.'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Love toggled successfully',
    schema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['loved', 'unloved'],
          example: 'loved'
        },
        loved: { 
          type: 'boolean',
          example: true
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async toggleLove(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleLove(campaignId, userId);
  }

  @Post('campaigns/:campaignId/share')
  @ApiOperation({ 
    summary: 'Share campaign',
    description: 'Records a share action for the campaign. Each share is tracked separately (not a toggle).'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Campaign shared successfully',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string',
          example: 'Campaign shared successfully'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async shareCampaign(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.shareCampaign(campaignId, userId);
  }

  @Post('campaigns/:campaignId/save')
  @ApiOperation({ 
    summary: 'Toggle save campaign',
    description: 'Saves or unsaves a campaign for later viewing. Saved campaigns appear in user\'s saved list.'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Save toggled successfully',
    schema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['saved', 'unsaved'],
          example: 'saved'
        },
        saved: { 
          type: 'boolean',
          example: true
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async toggleSave(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.toggleSave(campaignId, userId);
  }

  @Post('campaigns/:campaignId/impression')
  @ApiOperation({ 
    summary: 'Record impression',
    description: 'Records when a user views a campaign ad. Prevents duplicate impressions within 24 hours from the same user.'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiBody({ 
    type: RecordImpressionDto,
    description: 'Impression metadata including location and device information'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Impression recorded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string',
          example: 'Impression recorded'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async recordImpression(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: RecordImpressionDto,
  ) {
    return this.engagementService.recordImpression(campaignId, userId, body);
  }

  @Post('campaigns/:campaignId/click')
  @ApiOperation({ 
    summary: 'Record click',
    description: 'Records when a user clicks on a campaign ad. Updates CTR and deducts from campaign budget (₹0.50 per click).'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiBody({ 
    type: RecordClickDto,
    description: 'Click metadata including location and device information'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Click recorded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string',
          example: 'Click recorded'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async recordClick(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: RecordClickDto,
  ) {
    return this.engagementService.recordClick(campaignId, userId, body);
  }

  @Post('campaigns/:campaignId/conversion')
  @ApiOperation({ 
    summary: 'Record conversion',
    description: 'Records a conversion event (e.g., purchase, signup) resulting from the campaign. Notifies the vendor.'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiBody({ 
    type: RecordConversionDto,
    description: 'Conversion data including amount, type, and additional metadata'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Conversion recorded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'string',
          example: 'Conversion recorded'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async recordConversion(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
    @Body() body: RecordConversionDto,
  ) {
    return this.engagementService.recordConversion(campaignId, userId, body);
  }

  @Get('campaigns/:campaignId/status')
  @ApiOperation({ 
    summary: 'Get user engagement status',
    description: 'Retrieves the current user\'s engagement status with a campaign (liked, disliked, loved, saved).'
  })
  @ApiParam({ 
    name: 'campaignId', 
    description: 'Campaign ID',
    example: 'campaign_abc123'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Engagement status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        liked: { 
          type: 'boolean',
          example: true,
          description: 'Whether user has liked the campaign'
        },
        disliked: { 
          type: 'boolean',
          example: false,
          description: 'Whether user has disliked the campaign'
        },
        loved: { 
          type: 'boolean',
          example: true,
          description: 'Whether user has loved the campaign'
        },
        saved: { 
          type: 'boolean',
          example: false,
          description: 'Whether user has saved the campaign'
        }
      }
    }
  })
  async getEngagementStatus(
    @Param('campaignId') campaignId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.engagementService.getUserEngagementStatus(campaignId, userId);
  }
}