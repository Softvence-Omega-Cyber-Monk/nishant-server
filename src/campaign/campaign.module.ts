import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignScheduler } from './campaign.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { RazorpayModule } from '../razorpay/razorpay.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, RazorpayModule, NotificationModule],
  controllers: [CampaignController],
  providers: [CampaignService, CampaignScheduler],
  exports: [CampaignService],
})
export class CampaignModule {}
