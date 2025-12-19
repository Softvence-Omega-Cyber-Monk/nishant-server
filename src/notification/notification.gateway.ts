// src/notification/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<string, string[]> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || 
                    client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn('Client attempted connection without token');
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn('Invalid token payload');
        client.disconnect();
        return;
      }

      // Store socket connection
      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);

      client.data.userId = userId;
      client.join(userId);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Send connection confirmation
      client.emit('connected', { 
        userId, 
        message: 'Connected to notification service',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`WebSocket connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const updatedSockets = sockets.filter((id) => id !== client.id);
      
      if (updatedSockets.length > 0) {
        this.userSockets.set(userId, updatedSockets);
      } else {
        this.userSockets.delete(userId);
      }

      this.logger.log(`User ${userId} disconnected socket ${client.id}`);
    }
  }

  @OnEvent('notification')
  handleNotificationEvent(payload: any) {
    const { userId, ...notification } = payload;
    
    if (userId && this.userSockets.has(userId)) {
      this.server.to(userId).emit('notification', notification);
      this.logger.log(`Sent notification to user ${userId}`);
    }
  }

  sendToUser(userId: string, event: string, data: any) {
    if (this.userSockets.has(userId)) {
      this.server.to(userId).emit(event, data);
    }
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
}