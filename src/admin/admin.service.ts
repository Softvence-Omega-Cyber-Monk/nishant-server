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

        const totalRevenue = (await this.Prisma.campaign.aggregate({
            _sum: {
                budget: true
            },
            where: {
                AND: [
                    {
                        paymentStatus: "SUCCESS"
                    }
                ]
            }
        }))._sum.budget || 0;


        const data = {
            totalUser,
            totalAdmin,
            totalBannedUser,
            totalVendor,
            totalActiveCampaing,
            totalCompliteCampaing,
            totalPosedCampaing,
            totalRevenue
        };

        return data

    }

    async getAllVendor(page: number, limit: number) {

        const skip = (page - 1) * limit;

        const total = await this.Prisma.user.count({
            where: {
                AND: [
                    {
                        role: "VENDOR"
                    }
                ]
            }
        });

        const data = await this.Prisma.user.findMany({
            where: {
                role: "VENDOR",
                activeStatus: "ACTIVE"
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            },
            select: {
                userId: true,
                fullName: true,
                email: true,
                phone: true,
                photo: true,
                address: true
            }
        });

        const totalPage = Math.ceil(total / limit);

        const meta = {
            totalVendor: total,
            page,
            limit,
            totalPage
        };

        return {
            meta,
            data

        }


    }

    async getAllCampain(page: number, limit: number) {

        const skip = (page - 1) * limit;

        const totalCampaings = await this.Prisma.campaign.count();


        const campaings = await this.Prisma.campaign.findMany({
            select: {
                title: true,
                campaignId: true,
                status: true,
                budget: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                description: true,
                mediaUrls: true,
                vendorId: true,


                _count: {
                    select: {
                        clicks: true,
                        impressions: true
                    }
                }

            },

            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            }
        });

        const data = campaings.map((campaing) => ({
            campaignId: campaing.campaignId,
            title: campaing.title,
            status: campaing.status,
            budget: campaing.budget,
            startDate: campaing.startDate,
            endDate: campaing.endDate,
            createdAt: campaing.createdAt,
            description: campaing.description,
            mediaUrls: campaing.mediaUrls,
            vendorId: campaing.vendorId,

            clicks: campaing._count.clicks,
            impressions: campaing._count.impressions,

            ctr: campaing._count.impressions > 0 ? Number((campaing._count.clicks / campaing._count.impressions) * 100).toFixed(2) : 0

        }))

        const totalPage = Math.ceil(totalCampaings / limit)

        const meta = {
            totalCampaings,
            totalPage,
            page,
            limit
        }

        return {
            meta,
            data
        }

    };

    async getAllUser(page: number, limit: number, search?: string) {

        const skip = (page - 1) * limit;

        const whereCondition: any = {
            role: "USER"
        };

        if (search) {
            whereCondition.OR = [
                {
                    fullName: { contains: search, mode: "insensitive" }
                },
                {
                    email: { contains: search, mode: "insensitive" }
                },
                {
                    phone: { contains: search, mode: "insensitive" }
                },
                {
                    aadharNumber: { contains: search, mode: "insensitive" }
                },
                {
                    address: { contains: search, mode: "insensitive" }
                }
            ]
        }

        const totalUser = await this.Prisma.user.count({ where: whereCondition });

        const totalPage = Math.ceil(totalUser / limit);

        const data = await this.Prisma.user.findMany({

            where: whereCondition,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            }
        });

        const meta = {
            totalUser,
            totalPage,
            page,
            limit
        };

        return {
            data,
            meta
        }

    }

    async getUserProfile(userId: string) {
        const result = await this.Prisma.user.findUnique({
            where: {
                userId: userId
            },
            include: {
                reports: true
            }
        });

        return result

    }

}
