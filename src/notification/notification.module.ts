import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [NotificationService, NotificationSettingsService, NotificationGateway],
  exports: [NotificationService, NotificationSettingsService],
})
export class NotificationModule {}