import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
      constructor(
        private prisma: PrismaService,
      ) {}

async updateUserLocation(userId: string, latitude: number, longitude: number) {
  await this.prisma.user.update({
    where: { userId },
    data: {
      latitude,
      longitude,
    },
  });
}
    
}
