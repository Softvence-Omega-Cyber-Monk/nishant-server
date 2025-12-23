import { Injectable, NotFoundException } from '@nestjs/common';
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
            skip,
            take: limit,
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
        const result = await this.Prisma.campaign.update({
            where: {
                campaignId: campaignId
            },
            data: {
                status: "PAUSED"
            }
        });

        return result;
    }


}
