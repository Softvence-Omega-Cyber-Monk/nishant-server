import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus, TransactionStatus, TransactionType } from 'src/generated/enums';
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

        const totalNotSolvedReport = await this.Prisma.report.count({
            where: {
                isSolved: false
            }
        });

        const totalReport = await this.Prisma.report.count()

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
            totalNotSolvedReport,
            totalReport,
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


    async getAllCampain(page: number, limit: number, filters: { status?: string } = {},) {

        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters.status) where.status = filters.status;

        const totalCampaings = await this.Prisma.campaign.count({ where });

        const campaings = await this.Prisma.campaign.findMany({
            skip,
            take: limit,
            where,
            orderBy: {
                createdAt: "desc",
            },

            include: {
                vendor: {
                    select: {
                        userId: true,
                        fullName: true,
                        email: true,
                        photo: true,

                    },
                },
                _count: {
                    select: {
                        clicks: true,
                        impressions: true,
                    },
                },
            },
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
            vendorName: campaing.vendor.fullName,
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


    async getTodayCampaignStats(campaignId: string) {
        // Check campaign exists
        const campaign = await this.Prisma.campaign.findUnique({
            where: { campaignId }
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Today start & end
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Parallel queries
        const [
            impression,
            click,
            likeCount,
            dislikeCount,
            loveCount,
            commentCount,
            shareCount,
            saveCount
        ] = await Promise.all([
            this.Prisma.impression.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            }),

            this.Prisma.click.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            }),

            this.Prisma.like.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            }),

            this.Prisma.dislike.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            }),

            this.Prisma.love.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            }),

            this.Prisma.comment.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            }),

            this.Prisma.share.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            }),

            this.Prisma.save.count({
                where: {
                    campaignId,
                    createdAt: { gte: startOfToday, lte: endOfToday }
                }
            })
        ]);

        const totalEngagement =
            likeCount +
            dislikeCount +
            loveCount +
            commentCount +
            shareCount +
            saveCount;

        const ctr = impression > 0 ? (click / impression) * 100 : 0;

        const engagementRate =
            impression > 0 ? (totalEngagement / impression) * 100 : 0;

        return {
            campaignId,
            date: new Date().toISOString().split('T')[0],
            impression,
            click,
            ctr: Number(ctr.toFixed(2)),
            engagement: totalEngagement,
            engagementRate: Number(engagementRate.toFixed(2))
        };
    }

    async getLast7DaysCampaignStats(campaignId: string) {
        const campaign = await this.Prisma.campaign.findUnique({
            where: { campaignId }
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        // Helper: empty 7 days structure
        const daysMap = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];

            daysMap[key] = {
                date: key,
                impression: 0,
                click: 0,
                engagement: 0,
                ctr: 0,
                engagementRate: 0
            };
        }

        // Fetch all data once
        const [
            impressions,
            clicks,
            likes,
            dislikes,
            loves,
            comments,
            shares,
            saves
        ] = await Promise.all([
            this.Prisma.impression.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            }),
            this.Prisma.click.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            }),
            this.Prisma.like.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            }),
            this.Prisma.dislike.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            }),
            this.Prisma.love.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            }),
            this.Prisma.comment.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            }),
            this.Prisma.share.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            }),
            this.Prisma.save.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: today } },
                select: { createdAt: true }
            })
        ]);

        // Count impressions
        impressions.forEach(i => {
            const key = i.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].impression++;
        });

        // Count clicks
        clicks.forEach(c => {
            const key = c.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].click++;
        });

        // Engagements
        [...likes, ...dislikes, ...loves, ...comments, ...shares, ...saves].forEach(
            e => {
                const key = e.createdAt.toISOString().split('T')[0];
                if (daysMap[key]) daysMap[key].engagement++;
            }
        );

        // Calculate rates
        let totalImpression = 0;
        let totalClick = 0;
        let totalEngagement = 0;

        Object.values(daysMap).forEach((day: any) => {
            day.ctr =
                day.impression > 0 ? Number(((day.click / day.impression) * 100).toFixed(2)) : 0;

            day.engagementRate =
                day.impression > 0
                    ? Number(((day.engagement / day.impression) * 100).toFixed(2))
                    : 0;

            totalImpression += day.impression;
            totalClick += day.click;
            totalEngagement += day.engagement;
        });

        return {
            campaignId,
            range: 'Last 7 Days',
            summary: {
                impression: totalImpression,
                click: totalClick,
                ctr:
                    totalImpression > 0
                        ? Number(((totalClick / totalImpression) * 100).toFixed(2))
                        : 0,
                engagement: totalEngagement,
                engagementRate:
                    totalImpression > 0
                        ? Number(((totalEngagement / totalImpression) * 100).toFixed(2))
                        : 0
            },
            dailyStats: Object.values(daysMap)
        };
    }

    async getLast30DaysCampaignStats(campaignId: string) {
        const campaign = await this.Prisma.campaign.findUnique({
            where: { campaignId }
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Date range
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);

        // Prepare 30 days structure
        const daysMap: Record<string, any> = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];

            daysMap[key] = {
                date: key,
                impression: 0,
                click: 0,
                engagement: 0,
                ctr: 0,
                engagementRate: 0
            };
        }

        // Fetch all events once
        const [
            impressions,
            clicks,
            likes,
            dislikes,
            loves,
            comments,
            shares,
            saves
        ] = await Promise.all([
            this.Prisma.impression.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.click.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.like.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.dislike.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.love.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.comment.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.share.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.save.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            })
        ]);

        // Count impressions
        impressions.forEach(i => {
            const key = i.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].impression++;
        });

        // Count clicks
        clicks.forEach(c => {
            const key = c.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].click++;
        });

        // Engagement count
        [...likes, ...dislikes, ...loves, ...comments, ...shares, ...saves].forEach(
            e => {
                const key = e.createdAt.toISOString().split('T')[0];
                if (daysMap[key]) daysMap[key].engagement++;
            }
        );

        // Calculate daily + total
        let totalImpression = 0;
        let totalClick = 0;
        let totalEngagement = 0;

        Object.values(daysMap).forEach((day: any) => {
            day.ctr =
                day.impression > 0
                    ? Number(((day.click / day.impression) * 100).toFixed(2))
                    : 0;

            day.engagementRate =
                day.impression > 0
                    ? Number(((day.engagement / day.impression) * 100).toFixed(2))
                    : 0;

            totalImpression += day.impression;
            totalClick += day.click;
            totalEngagement += day.engagement;
        });

        return {
            campaignId,
            range: 'Last 30 Days',
            summary: {
                impression: totalImpression,
                click: totalClick,
                ctr:
                    totalImpression > 0
                        ? Number(((totalClick / totalImpression) * 100).toFixed(2))
                        : 0,
                engagement: totalEngagement,
                engagementRate:
                    totalImpression > 0
                        ? Number(((totalEngagement / totalImpression) * 100).toFixed(2))
                        : 0
            },
            dailyStats: Object.values(daysMap)
        };
    }

    async getLast90DaysCampaignStats(campaignId: string) {
        const campaign = await this.Prisma.campaign.findUnique({
            where: { campaignId }
        });

        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        // Date range
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);

        // Prepare 90 days structure
        const daysMap: Record<string, any> = {};
        for (let i = 0; i < 90; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];

            daysMap[key] = {
                date: key,
                impression: 0,
                click: 0,
                engagement: 0,
                ctr: 0,
                engagementRate: 0
            };
        }

        // Fetch all events once
        const [
            impressions,
            clicks,
            likes,
            dislikes,
            loves,
            comments,
            shares,
            saves
        ] = await Promise.all([
            this.Prisma.impression.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.click.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.like.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.dislike.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.love.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.comment.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.share.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.save.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            })
        ]);

        // Count impressions
        impressions.forEach(i => {
            const key = i.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].impression++;
        });

        // Count clicks
        clicks.forEach(c => {
            const key = c.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].click++;
        });

        // Engagement count
        [...likes, ...dislikes, ...loves, ...comments, ...shares, ...saves].forEach(
            e => {
                const key = e.createdAt.toISOString().split('T')[0];
                if (daysMap[key]) daysMap[key].engagement++;
            }
        );

        // Calculate daily + total
        let totalImpression = 0;
        let totalClick = 0;
        let totalEngagement = 0;

        Object.values(daysMap).forEach((day: any) => {
            day.ctr =
                day.impression > 0
                    ? Number(((day.click / day.impression) * 100).toFixed(2))
                    : 0;

            day.engagementRate =
                day.impression > 0
                    ? Number(((day.engagement / day.impression) * 100).toFixed(2))
                    : 0;

            totalImpression += day.impression;
            totalClick += day.click;
            totalEngagement += day.engagement;
        });

        return {
            campaignId,
            range: 'Last 90 Days',
            summary: {
                impression: totalImpression,
                click: totalClick,
                ctr:
                    totalImpression > 0
                        ? Number(((totalClick / totalImpression) * 100).toFixed(2))
                        : 0,
                engagement: totalEngagement,
                engagementRate:
                    totalImpression > 0
                        ? Number(((totalEngagement / totalImpression) * 100).toFixed(2))
                        : 0
            },
            dailyStats: Object.values(daysMap)
        };
    };


    async getLast7DaysClickImpressionChart(campaignId: string) {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        // Prepare 7 days map
        const daysMap: Record<string, any> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];

            daysMap[key] = {
                date: key,
                impression: 0,
                click: 0
            };
        }

        const [impressions, clicks] = await Promise.all([
            this.Prisma.impression.findMany({
                where: {
                    campaignId,
                    createdAt: { gte: startDate, lte: endDate }
                },
                select: { createdAt: true }
            }),
            this.Prisma.click.findMany({
                where: {
                    campaignId,
                    createdAt: { gte: startDate, lte: endDate }
                },
                select: { createdAt: true }
            })
        ]);

        impressions.forEach(i => {
            const key = i.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].impression++;
        });

        clicks.forEach(c => {
            const key = c.createdAt.toISOString().split('T')[0];
            if (daysMap[key]) daysMap[key].click++;
        });

        return Object.values(daysMap);
    }

    async getLast7DaysDayWiseChart(campaignId: string) {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Prepare last 7 days in correct order
        const daysMap: Record<string, any> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const day = dayNames[d.getDay()];

            daysMap[day] = {
                day,
                impression: 0,
                click: 0
            };
        }

        const [impressions, clicks] = await Promise.all([
            this.Prisma.impression.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            }),
            this.Prisma.click.findMany({
                where: { campaignId, createdAt: { gte: startDate, lte: endDate } },
                select: { createdAt: true }
            })
        ]);

        impressions.forEach(i => {
            const day = dayNames[i.createdAt.getDay()];
            if (daysMap[day]) daysMap[day].impression++;
        });

        clicks.forEach(c => {
            const day = dayNames[c.createdAt.getDay()];
            if (daysMap[day]) daysMap[day].click++;
        });

        return Object.values(daysMap);
    }

    async getCampainAnalyticalData(campaignId: string) {

        const today = this.getTodayCampaignStats(campaignId);
        const last7Days = this.getLast7DaysCampaignStats(campaignId);
        const last30Days = this.getLast30DaysCampaignStats(campaignId);
        const last90Days = this.getLast90DaysCampaignStats(campaignId);
        const last7DaysChatData = this.getLast7DaysClickImpressionChart(campaignId);
        return {
            today,
            last7Days,
            last30Days,
            last90Days,
            last7DaysChatData
        }

    };

    async updateCampaignStatus(campaignId: string) {
        // First, get the current campaign status
        const campaign = await this.Prisma.campaign.findUnique({
            where: { campaignId },
            select: { status: true }, // only need status
        });

        if (!campaign) {
            throw new Error("Campaign not found");
        }

        // Determine the new status
        let newStatus: CampaignStatus;
        if (campaign.status === "PAUSED") {
            newStatus = "RUNNING";
        } else if (campaign.status === "RUNNING") {
            newStatus = "PAUSED";
        } else {
            // Optional: if other status, you can either throw or leave unchanged
            newStatus = campaign.status;
        }

        // Update the campaign
        const updated = await this.Prisma.campaign.update({
            where: { campaignId },
            data: {
                status: newStatus,
            }
        });

        return updated;
    }


    async banUser(userId: string) {
        // Find the user by their userId and update their status to 'BANNED'
        const result = await this.Prisma.user.update({
            where: {
                userId: userId,  // Assuming 'userId' is the unique identifier for users in the database
            },
            data: {
                activeStatus: "BANNED",  // Update the activeStatus to 'BANNED'
            },
        });

        // Optionally, you can return the result (updated user details) or some confirmation message
        return result;  // This will return the updated user object
    }

    async getAllbannedUserByAdmin(page: number, limit: number) {
        // Count the total number of banned users
        const count = await this.Prisma.user.count({
            where: {
                activeStatus: "BANNED"
            }
        });

        // If no banned users are found, throw an exception
        if (count === 0) throw new NotFoundException("User Not Found");

        // Calculate pagination
        const skip = (page - 1) * limit;
        const totalPage = Math.ceil(count / limit);

        // Fetch the actual data
        const result = await this.Prisma.user.findMany({
            where: {
                activeStatus: "BANNED"
            },
            take: limit,
            skip: skip
        });

        // Return paginated response
        const data = {
            currentPage: page,   // Corrected typo
            limit: limit,
            totalPage,
            data: result
        };

        return data;
    }


    async getSingleBannedUserAlsoReport(userId: string) {
        const result = await this.Prisma.user.findUnique({
            where: {
                userId: userId
            },
            include: {
                reports: true
            },

        });

        return result;
    };


    async getSingleVendorAndAllCampaignAnalytics(vendorId: string) {

        const vendor = await this.Prisma.user.findUnique({
            where: { userId: vendorId },
            select: {
                userId: true,
                fullName: true,
                phone: true,
                email: true,
                description: true,
                category: true,
                location: true,
                instagramUrl: true,
                facebookUrl: true,
                websiteUrl: true,
                followerCount: true,
                profileCompleted: true,
                createdAt: true,
            },
        });


        // 1. Vendor এর সব campaign আনো
        const campaigns = await this.Prisma.campaign.findMany({
            where: { vendorId },
            select: {
                campaignId: true,
                title: true,
                status: true,
                budget: true,
                currentSpending: true,
                impressionCount: true,
                clickCount: true,
                ctr: true,
                createdAt: true,
            },
        });

        const totalCampaign = campaigns.length;

        const activeCampaign = campaigns.filter(
            c => c.status === CampaignStatus.RUNNING,
        ).length;

        // 2. Total impressions & clicks (সব campaign মিলিয়ে)
        const totalImpressions = campaigns.reduce(
            (sum, c) => sum + c.impressionCount,
            0,
        );

        const totalClicks = campaigns.reduce(
            (sum, c) => sum + c.clickCount,
            0,
        );

        // 3. Average CTR (overall)
        const averageCTR =
            totalImpressions > 0
                ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
                : 0;

        // 4. Total revenue (campaign payment transaction)
        const revenueAgg = await this.Prisma.transaction.aggregate({
            where: {
                userId: vendorId,
                type: TransactionType.CAMPAIGN_PAYMENT,
                status: TransactionStatus.SUCCESS,
            },
            _sum: {
                amount: true,
            },
        });

        const totalRevenue = revenueAgg._sum.amount || 0;

        // 5. Per-campaign breakdown
        const campaignBreakdown = campaigns.map(c => ({
            campaignId: c.campaignId,
            title: c.title,
            status: c.status,
            impressions: c.impressionCount,
            clicks: c.clickCount,
            ctr:
                c.impressionCount > 0
                    ? Number(((c.clickCount / c.impressionCount) * 100).toFixed(2))
                    : 0,
            budget: c.budget,
            currentSpending: c.currentSpending,
        }));

        return {

            vendorId,
            vendor,
            summary: {
                totalCampaign,
                activeCampaign,
                totalRevenue,
                averageCTR,
                totalImpressions,
                totalClicks,
            },
            campaigns: campaignBreakdown,
        };
    };


    async getAllCampaignAnalytics(page = 1, limit = 10,filters: { status?: string } = {}) {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters.status) where.status = filters.status;

        // 1. Total campaigns count
        const totalCampaigns = await this.Prisma.campaign.count({ where });

        // 2. Fetch campaigns with vendor info (name + photo added)
        const campaigns = await this.Prisma.campaign.findMany({
            skip,
            take: limit,
            where,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                campaignId: true,
                title: true,
                description: true,
                mediaUrls: true,

                budget: true,
                currentSpending: true,
                remainingSpending: true,

                startDate: true,
                endDate: true,
                status: true,
                paymentStatus: true,

                // Engagement counters
                likeCount: true,
                dislikeCount: true,
                loveCount: true,
                commentCount: true,
                shareCount: true,
                saveCount: true,
                impressionCount: true,
                clickCount: true,
                conversionCount: true,
                ctr: true,

                createdAt: true,
                updatedAt: true,

                // ✅ Vendor info (UPDATED)
                vendor: {
                    select: {
                        userId: true,
                        fullName: true,   // vendor name
                        photo: true,      // profile image
                        category: true,
                        location: true,
                        followerCount: true,
                        profileCompleted: true,
                    },
                },
            },
        });

        // 3. Normalize response
        const campaignList = campaigns.map(c => ({
            campaignId: c.campaignId,

            title: c.title,
            description: c.description,
            mediaUrls: c.mediaUrls,

            budget: c.budget,
            currentSpending: c.currentSpending,
            remainingSpending: c.remainingSpending,

            startDate: c.startDate,
            endDate: c.endDate,
            status: c.status,
            paymentStatus: c.paymentStatus,

            vendor: {
                vendorId: c.vendor.userId,
                name: c.vendor.fullName,
                profileImage: c.vendor.photo, // ✅ added
                category: c.vendor.category,
                location: c.vendor.location,
                followerCount: c.vendor.followerCount,
                profileCompleted: c.vendor.profileCompleted,
            },

            engagement: {
                likes: c.likeCount,
                dislikes: c.dislikeCount,
                loves: c.loveCount,
                comments: c.commentCount,
                shares: c.shareCount,
                saves: c.saveCount,
                impressions: c.impressionCount,
                clicks: c.clickCount,
                conversions: c.conversionCount,
                ctr:
                    c.impressionCount > 0
                        ? Number(((c.clickCount / c.impressionCount) * 100).toFixed(2))
                        : 0,
            },

            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

        // 4. Pagination meta
        return {
            pagination: {
                totalCampaign: totalCampaigns,
                currentPage: page,
                limit: limit,
                totalPages: Math.ceil(totalCampaigns / limit)
            },
            campaigns: campaignList,
        };
    }

}
