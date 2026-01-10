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
  DefaultValuePipe,
  ParseIntPipe,
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
import { CampaignQueryDto } from './dto/Campaign-query-dto';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CampaignController {
  constructor(private campaignService: CampaignService) { }

  // @Post()
  // @Roles('VENDOR')
  // @UseInterceptors(FilesInterceptor('mediaFiles', 10))
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({
  //   summary: 'Create new campaign',
  //   description:
  //     'Creates a new advertising campaign with media files. Returns Razorpay order details for payment. Campaign will be activated after successful payment verification.',
  // })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     required: [
  //       'title',
  //       'description',
  //       'mediaFiles',
  //       'targetedLocation',
  //       'budget',
  //       'startDate',
  //       'endDate',
  //     ],
  //     properties: {
  //       title: {
  //         type: 'string',
  //         example: 'Summer Sale 2024',
  //         description: 'Campaign title',
  //       },
  //       description: {
  //         type: 'string',
  //         example: 'Amazing summer sale with 50% off on all products',
  //         description: 'Detailed campaign description',
  //       },
  //       mediaFiles: {
  //         type: 'array',
  //         items: { type: 'string', format: 'binary' },
  //         description:
  //           'At least one media file required (images: jpeg, jpg, png, gif, webp | videos: mp4, avi, mov, wmv)',
  //         minItems: 1,
  //         maxItems: 10,
  //       },
  //       targetedLocation: {
  //         type: 'string',
  //         example:
  //           '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}',
  //         description:
  //           'JSON string with geographical targeting (country, state, city, radius)',
  //       },
  //       targetedAgeMin: {
  //         type: 'number',
  //         example: 18,
  //         minimum: 13,
  //         maximum: 100,
  //         description: 'Minimum target age (optional)',
  //       },
  //       targetedAgeMax: {
  //         type: 'number',
  //         example: 45,
  //         minimum: 13,
  //         maximum: 100,
  //         description: 'Maximum target age (optional)',
  //       },
  //       budget: {
  //         type: 'number',
  //         example: 10000,
  //         minimum: 100,
  //         description: 'Campaign budget in INR',
  //       },
  //       startDate: {
  //         type: 'string',
  //         format: 'date-time',
  //         example: '2024-12-20T00:00:00Z',
  //         description: 'Campaign start date and time (ISO 8601)',
  //       },
  //       endDate: {
  //         type: 'string',
  //         format: 'date-time',
  //         example: '2024-12-31T23:59:59Z',
  //         description: 'Campaign end date and time (ISO 8601)',
  //       },
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description:
  //     'Campaign created successfully. Returns campaign details and Razorpay order for payment.',
  //   schema: {
  //     example: {
  //       campaign: {
  //         campaignId: 'uuid-here',
  //         vendorId: 'uuid-here',
  //         title: 'Summer Sale 2024',
  //         description: 'Amazing summer sale',
  //         status: 'RUNNING',
  //         budget: 10000,
  //         razorpayOrderId: 'order_JZg8h2E3HGHD6h',
  //       },
  //       order: {
  //         id: 'order_JZg8h2E3HGHD6h',
  //         amount: 1000000,
  //         currency: 'INR',
  //       },
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Invalid input or missing required fields',
  // })
  // @ApiResponse({
  //   status: HttpStatus.FORBIDDEN,
  //   description: 'Only vendors can create campaigns',
  // })
  // async createCampaign(
  //   @GetUser('userId') userId: string,
  //   @Body() body: any,
  //   @UploadedFiles(
  //     new ParseFilePipe({
  //       validators: [
  //         new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
  //         new FileTypeValidator({
  //           fileType:
  //             /(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|avi|mov|wmv))/,
  //         }),
  //       ],
  //       fileIsRequired: false, // We'll validate in the method
  //     }),
  //   )
  //   files?: Express.Multer.File[],
  // ) {
  //   // Validate files exist
  //   if (!files || files.length === 0) {
  //     throw new BadRequestException('At least one media file is required');
  //   }

  //   // Parse targetedLocation from JSON string
  //   let targetedLocation;
  //   try {
  //     targetedLocation =
  //       typeof body.targetedLocation === 'string'
  //         ? JSON.parse(body.targetedLocation)
  //         : body.targetedLocation;
  //   } catch (error) {
  //     throw new BadRequestException(
  //       'Invalid targetedLocation format. Must be valid JSON string.',
  //     );
  //   }

  //   // Validate required fields
  //   if (
  //     !body.title ||
  //     !body.description ||
  //     !body.budget ||
  //     !body.startDate ||
  //     !body.endDate
  //   ) {
  //     throw new BadRequestException(
  //       'Missing required fields: title, description, budget, startDate, endDate',
  //     );
  //   }

  //   // Convert numeric strings to numbers
  //   const dto: CreateCampaignDto = {
  //     ...body,
  //     targetedLocation,
  //     targetedAgeMin: body.targetedAgeMin
  //       ? Number(body.targetedAgeMin)
  //       : undefined,
  //     targetedAgeMax: body.targetedAgeMax
  //       ? Number(body.targetedAgeMax)
  //       : undefined,
  //     budget: Number(body.budget),
  //     mediaFiles: files,
  //   };

  //   return this.campaignService.createCampaign(userId, dto, files);
  // }

  @Post()
  @Roles('VENDOR')
  @UseInterceptors(FilesInterceptor('mediaFiles', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new campaign',
    description:
      'Creates a new advertising campaign with media files. Returns Razorpay order details for payment. Campaign will be activated after successful payment verification.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'title',
        'description',
        'mediaFiles',
        'targetedLocation',
        'budget',
        'startDate',
        'endDate',
      ],
      properties: {
        title: {
          type: 'string',
          example: 'Summer Sale 2024',
          description: 'Campaign title',
        },
        description: {
          type: 'string',
          example: 'Amazing summer sale with 50% off on all products',
          description: 'Detailed campaign description',
        },
        mediaFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'At least one media file required (images: jpeg, jpg, png, gif, webp | videos: mp4, avi, mov, wmv)',
          minItems: 1,
          maxItems: 10,
        },
        targetedLocation: {
          type: 'string',
          example:
            '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":50}',
          description:
            'JSON string with geographical targeting (country, state, city, radius in km)',
        },
        // NEW: Optional direct coordinate override
        targetLatitude: {
          type: 'number',
          example: 19.076,
          description: 'Optional: Direct latitude (bypasses geocoding)',
          nullable: true,
        },
        targetLongitude: {
          type: 'number',
          example: 72.8777,
          description: 'Optional: Direct longitude (bypasses geocoding)',
          nullable: true,
        },
        targetedAgeMin: {
          type: 'number',
          example: 18,
          minimum: 13,
          maximum: 100,
          description: 'Minimum target age (optional)',
        },
        targetedAgeMax: {
          type: 'number',
          example: 45,
          minimum: 13,
          maximum: 100,
          description: 'Maximum target age (optional)',
        },
        budget: {
          type: 'number',
          example: 10000,
          minimum: 100,
          description: 'Campaign budget in INR',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-12-20T00:00:00Z',
          description: 'Campaign start date and time (ISO 8601)',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-12-31T23:59:59Z',
          description: 'Campaign end date and time (ISO 8601)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Campaign created successfully. Returns campaign details and Razorpay order for payment.',
    schema: {
      example: {
        campaign: {
          campaignId: 'uuid-here',
          vendorId: 'uuid-here',
          title: 'Summer Sale 2024',
          description: 'Amazing summer sale',
          status: 'PAUSED',
          budget: 10000,
          razorpayOrderId: 'order_demo_123456789',
        },
        order: {
          id: 'order_demo_123456789',
          amount: 1000000,
          currency: 'INR',
        },
        demoMode: true,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only vendors can create campaigns',
  })
  async createCampaign(
    @GetUser('userId') userId: string,
    @Body() body: any,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|avi|mov|wmv))/,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    // Validate files exist
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one media file is required');
    }

    // Parse targetedLocation from JSON string
    let targetedLocation;
    try {
      targetedLocation =
        typeof body.targetedLocation === 'string'
          ? JSON.parse(body.targetedLocation)
          : body.targetedLocation;
    } catch (error) {
      throw new BadRequestException(
        'Invalid targetedLocation format. Must be valid JSON string.',
      );
    }

    // Validate required fields
    if (
      !body.title ||
      !body.description ||
      !body.budget ||
      !body.startDate ||
      !body.endDate
    ) {
      throw new BadRequestException(
        'Missing required fields: title, description, budget, startDate, endDate',
      );
    }

    // Convert numeric strings to numbers + handle new optional fields
    const dto: CreateCampaignDto = {
      ...body,
      targetedLocation,
      targetedAgeMin: body.targetedAgeMin
        ? Number(body.targetedAgeMin)
        : undefined,
      targetedAgeMax: body.targetedAgeMax
        ? Number(body.targetedAgeMax)
        : undefined,
      budget: Number(body.budget),
      // NEW: Optional direct coordinates
      targetLatitude: body.targetLatitude
        ? Number(body.targetLatitude)
        : undefined,
      targetLongitude: body.targetLongitude
        ? Number(body.targetLongitude)
        : undefined,
      mediaFiles: files,
    };

    return this.campaignService.createCampaign(userId, dto, files);
  }


  // @Get('feed-ads')
  // @Roles('VENDOR', 'USER')
  // @ApiOperation({
  //   summary: 'Get targeted campaign ads feed',
  //   description:
  //     'Fetches a randomized feed of active campaigns (ads) to the logged-in user based on age and budget availability.',
  // })
  // async getFeed(
  //   @GetUser()
  //   user: {
  //     userId: string;
  //     age: number;
  //     country: string;
  //     state?: string;
  //     city?: string;
  //   },
  //   @Query() query: CampaignQueryDto,
  // ) {
  //   return this.campaignService.getTargetedCampaigns(
  //     user,
  //     Number(query.skip),
  //     Number(query.take),
  //   );
  // }

  @Get('feed')
  @Roles('USER')
  @ApiOperation({
    summary: 'Get campaign feed',
    description:
      'Returns personalized location-based campaigns when no search query. When ?search= is provided, returns global search results from all running campaigns (ignores location).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term (title or description). If provided, returns global results ignoring location.',
    example: 'summer sale',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feed or search results',
  })
  async getFeed(
    @GetUser('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    if (search && search.trim()) {
      return this.campaignService.searchCampaigns(userId, search.trim(), page, limit);
    }

    return this.campaignService.getUserFeed(userId, page, limit);
  }


  @Post('verify-payment')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Verify Razorpay payment',
    description:
      'Verifies Razorpay payment signature and activates the campaign. Call this after successful payment on frontend.',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment verified and campaign activated',
    schema: {
      example: {
        campaignId: 'uuid-here',
        status: 'RUNNING',
        paymentStatus: 'SUCCESS',
        title: 'Summer Sale 2024',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment signature',
  })
  async verifyPayment(@Body() dto: PaymentVerificationDto) {
    return this.campaignService.verifyPaymentAndActivateCampaign(dto);
  }

  @Get('my-campaigns')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Get vendor campaigns',
    description:
      'Retrieves all campaigns created by the authenticated vendor with engagement statistics.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['RUNNING', 'PAUSED', 'COMPLETED'],
    description: 'Filter by campaign status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns list of campaigns with stats',
    schema: {
      example: [
        {
          campaignId: 'uuid-here',
          title: 'Summer Sale 2024',
          status: 'RUNNING',
          budget: 10000,
          currentSpending: 2500,
          remainingSpending: 7500,
          impressionCount: 5000,
          clickCount: 250,
          ctr: 5.0,
          _count: {
            likes: 120,
            comments: 45,
            shares: 30,
          },
        },
      ],
    },
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
    description:
      'Retrieves comprehensive statistics for all campaigns including total spending, impressions, clicks, conversions.',
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
    description:
      'Retrieves detailed information about a specific campaign including all comments, engagement metrics, and location-based statistics.',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns detailed campaign information',
    schema: {
      example: {
        campaignId: 'uuid-here',
        title: 'Summer Sale 2024',
        description: 'Campaign description',
        mediaUrls: [{ type: 'image', url: 'https://...', publicId: 'xxx' }],
        status: 'RUNNING',
        budget: 10000,
        currentSpending: 2500,
        ctr: '5.00',
        locationStats: {
          Mumbai: { impressions: 1000, clicks: 50, ctr: '5.00' },
          Delhi: { impressions: 800, clicks: 40, ctr: '5.00' },
        },
        comments: [],
        _count: {
          likes: 120,
          clicks: 250,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this campaign',
  })
  async getCampaignDetails(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.getCampaignDetails(campaignId, userId);
  }

  // @Put(':campaignId')
  // @Roles('VENDOR')
  // @UseInterceptors(FilesInterceptor('mediaFiles', 10))
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({
  //   summary: 'Update campaign',
  //   description:
  //     'Updates campaign details. Can update text fields, dates, targeting, and replace media files.',
  // })
  // @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       title: { type: 'string', example: 'Updated Title' },
  //       description: { type: 'string', example: 'Updated description' },
  //       mediaFiles: {
  //         type: 'array',
  //         items: { type: 'string', format: 'binary' },
  //         description: 'Replace media files (optional)',
  //       },
  //       targetedLocation: {
  //         type: 'string',
  //         example: '{"country":"India","city":"Delhi"}',
  //         description: 'Update geographical targeting (optional)',
  //       },
  //       targetedAgeMin: { type: 'number', example: 20 },
  //       targetedAgeMax: { type: 'number', example: 50 },
  //       startDate: { type: 'string', format: 'date-time' },
  //       endDate: { type: 'string', format: 'date-time' },
  //       status: { type: 'string', enum: ['RUNNING', 'PAUSED', 'COMPLETED'] },
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Campaign updated successfully',
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'Campaign not found',
  // })
  // @ApiResponse({
  //   status: HttpStatus.FORBIDDEN,
  //   description: 'Access denied to this campaign',
  // })
  // async updateCampaign(
  //   @GetUser('userId') userId: string,
  //   @Param('campaignId') campaignId: string,
  //   @Body() body: any,
  //   @UploadedFiles() files?: Express.Multer.File[],
  // ) {
  //   // Parse targetedLocation if provided
  //   let dto: UpdateCampaignDto = { ...body };

  //   if (body.targetedLocation) {
  //     try {
  //       dto.targetedLocation =
  //         typeof body.targetedLocation === 'string'
  //           ? JSON.parse(body.targetedLocation)
  //           : body.targetedLocation;
  //     } catch (error) {
  //       throw new BadRequestException('Invalid targetedLocation format');
  //     }
  //   }

  //   // Convert numeric strings to numbers if provided
  //   if (body.targetedAgeMin) dto.targetedAgeMin = Number(body.targetedAgeMin);
  //   if (body.targetedAgeMax) dto.targetedAgeMax = Number(body.targetedAgeMax);
  //   if (body.budget) dto.budget = Number(body.budget);

  //   return this.campaignService.updateCampaign(campaignId, userId, dto, files);
  // }





  @Put(':campaignId')
  @Roles('VENDOR')
  @UseInterceptors(FilesInterceptor('mediaFiles', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update campaign',
    description:
      'Updates campaign details. Can update text fields, dates, targeting, budget, status, and replace media files.',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Title' },
        description: { type: 'string', example: 'Updated description' },
        mediaFiles: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Replace all media files with new ones (optional)',
        },
        targetedLocation: {
          type: 'string',
          example: '{"country":"India","state":"Maharashtra","city":"Mumbai","radius":75}',
          description: 'Update geographical targeting as JSON string (optional)',
        },
        // NEW: Optional direct coordinate override
        targetLatitude: {
          type: 'number',
          example: 19.076,
          description: 'Optional: Direct latitude override (bypasses geocoding)',
          nullable: true,
        },
        targetLongitude: {
          type: 'number',
          example: 72.8777,
          description: 'Optional: Direct longitude override (bypasses geocoding)',
          nullable: true,
        },
        targetRadiusKm: {
          type: 'number',
          example: 75,
          minimum: 5,
          maximum: 200,
          description: 'Optional: Update radius in kilometers directly',
        },
        targetedAgeMin: { type: 'number', example: 20 },
        targetedAgeMax: { type: 'number', example: 50 },
        budget: { type: 'number', example: 15000 },
        startDate: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' },
        endDate: { type: 'string', format: 'date-time', example: '2025-02-01T23:59:59Z' },
        status: {
          type: 'string',
          enum: ['RUNNING', 'PAUSED', 'COMPLETED'],
          example: 'RUNNING'
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this campaign',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Parse targetedLocation if provided (exactly like before)
    let dto: UpdateCampaignDto = { ...body };

    if (body.targetedLocation) {
      try {
        dto.targetedLocation =
          typeof body.targetedLocation === 'string'
            ? JSON.parse(body.targetedLocation)
            : body.targetedLocation;
      } catch (error) {
        throw new BadRequestException('Invalid targetedLocation format. Must be valid JSON.');
      }
    }

    // Convert numeric strings to numbers if provided
    if (body.targetedAgeMin !== undefined) {
      dto.targetedAgeMin = Number(body.targetedAgeMin);
    }
    if (body.targetedAgeMax !== undefined) {
      dto.targetedAgeMax = Number(body.targetedAgeMax);
    }
    if (body.budget !== undefined) {
      dto.budget = Number(body.budget);
    }

    // NEW: Handle optional direct geo overrides
    if (body.targetLatitude !== undefined) {
      dto.targetLatitude = Number(body.targetLatitude);
    }
    if (body.targetLongitude !== undefined) {
      dto.targetLongitude = Number(body.targetLongitude);
    }
    if (body.targetRadiusKm !== undefined) {
      dto.targetRadiusKm = Number(body.targetRadiusKm);
    }

    // Pass files for media replacement (optional)
    dto.mediaFiles = files;

    return this.campaignService.updateCampaign(campaignId, userId, dto, files);
  }
















  @Put(':campaignId/pause')
  @Roles('VENDOR')
  @ApiOperation({
    summary: 'Pause campaign',
    description:
      'Pauses a running campaign. No impressions or clicks will be recorded while paused.',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign paused successfully',
    schema: {
      example: {
        campaignId: 'uuid-here',
        status: 'PAUSED',
        title: 'Summer Sale 2024',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
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
    description:
      'Resumes a paused campaign. Campaign will start recording impressions and clicks again.',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign resumed successfully',
    schema: {
      example: {
        campaignId: 'uuid-here',
        status: 'RUNNING',
        title: 'Summer Sale 2024',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
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
    description:
      'Permanently deletes a campaign and all associated media files from Cloudinary.',
  })
  @ApiParam({ name: 'campaignId', description: 'Campaign UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Campaign deleted successfully',
    schema: {
      example: {
        message: 'Campaign deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this campaign',
  })
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
    description:
      'Adds a comment to a campaign. Can also reply to existing comments by providing parentId.',
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
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comment added successfully',
    schema: {
      example: {
        commentId: 'uuid-here',
        campaignId: 'uuid-here',
        userId: 'uuid-here',
        content: 'Great campaign!',
        parentId: null,
        user: {
          userId: 'uuid-here',
          fullName: 'John Doe',
          photo: 'https://...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Campaign not found',
  })
  async addComment(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.campaignService.addComment(campaignId, userId, dto);
  }
}
