import { Injectable } from '@nestjs/common';
import { UserActiveStatus } from 'src/generated';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private Prisma: PrismaService) { };

    async adminAnalatycs() {
        const totalUser = await this.Prisma.user.count({
            where: {
                AND: [
                    {
                        role: "USER"
                    },
                    {
                        activeStatus: 'ACTIVE'
                    }
                ]
            }
        });

        const totalBannedUser = await this.Prisma.user.count({
            where: {
                role: "USER",
                activeStatus: "BANNED"
            }
        });

        const totalVendor = await this.Prisma.user.count({
            where: {
                role: "VENDOR"
            }
        });

        const totalAdmin = await this.Prisma.user.count({
            where: {
                role: "ADMIN"
            }
        });

        const totalAdminUser = await this.Prisma.user.count({
            where: {
                role: "ADMIN"
            }
        });

        const totalActiveCampaing = await this.Prisma.campaign.count({
            where: {
                status: "RUNNING"
            }
        });

        const totalCompliteCampaing = await this.Prisma.campaign.count({
            where: {
                status: "COMPLETED"
            }
        });

        const totalPosedCampaing = await this.Prisma.campaign.count({
            where: {
                status: "PAUSED"
            }
        });

    }

}
