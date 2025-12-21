import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CampaignModule } from './campaign/campaign.module';
import { EngagementModule } from './engagement/engagement.module';
import { NotificationModule } from './notification/notification.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { VendorModule } from './vendor/vendor.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AadharModule } from './aadhar/aadhar.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationGateway } from './notification/notification.gateway';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration], // THIS IS CRITICAL - Load the configuration
    }),
    PrismaModule,
    AuthModule,
    CampaignModule,
    NotificationModule,
    RazorpayModule,
    VendorModule,
    CloudinaryModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    EngagementModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
