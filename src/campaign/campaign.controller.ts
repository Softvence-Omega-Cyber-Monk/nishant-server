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
import { CampaignService } from './campaign.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaymentVerificationDto } from './dto/payment-verification.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Post()
  @Roles('VENDOR')
  @UseInterceptors(FilesInterceptor('mediaFiles', 10))
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
  async verifyPayment(@Body() dto: PaymentVerificationDto) {
    return this.campaignService.verifyPaymentAndActivateCampaign(dto);
  }

  @Get('my-campaigns')
  @Roles('VENDOR')
  async getVendorCampaigns(
    @GetUser('userId') userId: string,
    @Query('status') status?: string,
  ) {
    return this.campaignService.getVendorCampaigns(userId, status);
  }

  @Get('stats')
  @Roles('VENDOR')
  async getCampaignStats(@GetUser('userId') userId: string) {
    return this.campaignService.getCampaignStats(userId);
  }

  @Get(':campaignId')
  @Roles('VENDOR')
  async getCampaignDetails(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.getCampaignDetails(campaignId, userId);
  }

  @Put(':campaignId')
  @Roles('VENDOR')
  @UseInterceptors(FilesInterceptor('mediaFiles', 10))
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
  async pauseCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.pauseCampaign(campaignId, userId);
  }

  @Put(':campaignId/resume')
  @Roles('VENDOR')
  async resumeCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.resumeCampaign(campaignId, userId);
  }

  @Delete(':campaignId')
  @Roles('VENDOR')
  async deleteCampaign(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.deleteCampaign(campaignId, userId);
  }

  @Post(':campaignId/comments')
  @Roles('VENDOR', 'USER')
  async addComment(
    @GetUser('userId') userId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.campaignService.addComment(campaignId, userId, dto);
  }
}