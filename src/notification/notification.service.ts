import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: any;
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async sendNotification(userId: string, payload: NotificationPayload) {
    // Check notification settings
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return;
    }

    // Filter based on notification type and settings
    let shouldSend = false;
    switch (payload.type) {
      case 'CAMPAIGN_PERFORMANCE':
        shouldSend = settings.campaignPerformanceUpdates;
        break;
      case 'LOW_BUDGET_ALERT':
        shouldSend = settings.lowBudgetAlert;
        break;
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_FAILED':
        shouldSend = settings.paymentTransactionUpdates;
        break;
      case 'CAMPAIGN_STARTED':
      case 'CAMPAIGN_COMPLETED':
        shouldSend = settings.liveCampaignUpdates;
        break;
      case 'NEW_COMMENT':
        shouldSend = settings.liveCampaignUpdates;
        break;
      default:
        shouldSend = true;
    }

    if (shouldSend) {
      // Emit event for WebSocket/SSE
      this.eventEmitter.emit('notification', {
        userId,
        ...payload,
        timestamp: new Date(),
      });

      // You can also store notifications in database if needed
      // await this.prisma.notification.create({ ... });
    }
  }

  async sendBulkNotifications(userIds: string[], payload: NotificationPayload) {
    const notifications = userIds.map((userId) =>
      this.sendNotification(userId, payload),
    );
    await Promise.all(notifications);
  }
}