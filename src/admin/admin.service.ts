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


    async getAllReports(page: number, limit: number) {
        const totalReport = await this.Prisma.report.count({
            where: {
                isSolved: false
            }
        });

        const skip = (page - 1) * limit;

        const totalPage = Math.ceil(totalReport / limit);


        const data = await this.Prisma.report.findMany({
            where: {
                isSolved: false,
            },
            include: {
                campaign: true,
                user: true
            },
            skip,
            take: limit
        });

        return {
            meta: {
                totalReport,
                totalPage,
                page,
                limit
            },
            data
        }
    };


    async updateReport(reportId: string) {
        const updateReport = await this.Prisma.report.update({
            where: {
                reportId: reportId
            },
            data: {
                isSolved: true
            }
        });
        return updateReport
    };

    async reveniewTrendAndTopTenCampain() {
        const now = new Date();

        const monthlyRevenue: any = [];

        for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const monthRevenue = await this.Prisma.campaign.aggregate({
                where: {
                    paymentStatus: "SUCCESS",
                    createdAt: {
                        gte: start,
                        lt: end,
                    },
                },
                _sum: {
                    budget: true,
                },
            });

            monthlyRevenue.push({
                month: start.toLocaleString("default", { month: "short", year: "numeric" }),
                revenue: monthRevenue._sum.budget || 0,
            });
        }

        const revenueWithGrowth = monthlyRevenue.map((item, index, arr) => {
            if (index === 0) return { ...item, growthPercentage: null, trend: "NO_CHANGE" };

            const previousRevenue = arr[index - 1].revenue;
            const currentRevenue = item.revenue;

            let percentage = 0;
            let trend: "UP" | "DOWN" | "NO_CHANGE" = "NO_CHANGE";

            if (previousRevenue > 0) {
                percentage = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
                trend = percentage > 0 ? "UP" : percentage < 0 ? "DOWN" : "NO_CHANGE";
            } else if (currentRevenue > 0) {
                percentage = 100;
                trend = "UP";
            }

            return {
                ...item,
                growthPercentage: Number(percentage.toFixed(2)),
                trend,
            };
        });

        const topCampaigns = await this.Prisma.campaign.findMany({
            where: { paymentStatus: "SUCCESS" },
            orderBy: { impressionCount: "desc" },
            take: 10,
            select: {
                campaignId: true,
                title: true,
                impressionCount: true,
                budget: true,
                createdAt: true,
            },
        });

        return {
            monthlyRevenue: revenueWithGrowth,
            topCampaigns,
        };
    }

    async reveniewOverview() {

        const total = await this.Prisma.campaign.aggregate({
            where: {
                paymentStatus: "SUCCESS"
            },
            _sum: {
                budget: true
            }
        });


        const totalReveniew = total._sum.budget || 0;

        const now = new Date();

        // Last 30 days
        const last30Days = new Date();
        last30Days.setDate(now.getDate() - 30);

        // Previous 30 days (30–60 days ago)
        const prev30Days = new Date();
        prev30Days.setDate(now.getDate() - 60);

        // Last 30 days revenue
        const currentRevenue = await this.Prisma.campaign.aggregate({
            where: {
                paymentStatus: "SUCCESS",
                createdAt: {
                    gte: last30Days,
                    lte: now,
                },
            },
            _sum: {
                budget: true,
            },
        });

        // Previous 30 days revenue
        const previousRevenue = await this.Prisma.campaign.aggregate({
            where: {
                paymentStatus: "SUCCESS",
                createdAt: {
                    gte: prev30Days,
                    lt: last30Days,
                },
            },
            _sum: {
                budget: true,
            },
        });

        const current = currentRevenue._sum.budget || 0;
        const previous = previousRevenue._sum.budget || 0;

        // Percentage calculation
        let percentage = 0;
        let trend: "UP" | "DOWN" | "NO_CHANGE" = "NO_CHANGE";

        if (previous > 0) {
            percentage = ((current - previous) / previous) * 100;
            trend = percentage > 0 ? "UP" : percentage < 0 ? "DOWN" : "NO_CHANGE";
        } else if (current > 0) {
            percentage = 100;
            trend = "UP";
        }

        const groth = {
            last30DaysRevenue: current,
            previous30DaysRevenue: previous,
            growthPercentage: Number(percentage.toFixed(2)),
            trend,
        };

        const reveniewTrendAndTopTenCampain = this.reveniewTrendAndTopTenCampain();

        return {
            totalReveniew,
            groth,
            reveniewTrendAndTopTenCampain
        };
    };

}
