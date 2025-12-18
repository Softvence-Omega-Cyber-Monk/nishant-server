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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VendorService } from './vendor.service';
import { NotificationSettingsService } from '../notification/notification-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { UpdateNotificationSettingsDto } from 'src/notification/dto/update-notification-settings.dto';

@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class VendorController {
  constructor(
    private vendorService: VendorService,
    private notificationSettingsService: NotificationSettingsService,
  ) {}

  // Profile Management
  @Get('profile')
  async getProfile(@GetUser('userId') userId: string) {
    return this.vendorService.getVendorProfile(userId);
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('photo'))
  async updateProfile(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateVendorProfileDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.vendorService.updateVendorProfile(userId, dto, photo);
  }

  // Transaction Management
  @Get('transactions')
  async getTransactions(
    @GetUser('userId') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.vendorService.getTransactionHistory(userId, page, limit);
  }

  @Get('transactions/stats')
  async getTransactionStats(@GetUser('userId') userId: string) {
    return this.vendorService.getTransactionStats(userId);
  }

  // Notification Settings
  @Get('notification-settings')
  async getNotificationSettings(@GetUser('userId') userId: string) {
    return this.notificationSettingsService.getNotificationSettings(userId);
  }

  @Put('notification-settings')
  async updateNotificationSettings(
    @GetUser('userId') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationSettingsService.updateNotificationSettings(userId, dto);
  }
}