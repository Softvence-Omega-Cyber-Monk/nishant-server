import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationSettingsService } from './notification-settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [PrismaModule, EventEmitterModule.forRoot()],
  providers: [NotificationService, NotificationSettingsService],
  exports: [NotificationService, NotificationSettingsService],
})
export class NotificationModule {}