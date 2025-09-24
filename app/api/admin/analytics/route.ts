import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdminAuth(request);
    if (error) return error;

    // Get real statistics from the database
    const [
      totalInspirations,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      platformStats,
      dailyStats,
      monthlyStats,
    ] = await Promise.all([
      // Total inspirations count
      prisma.inspiration.count(),
      
      // Submission stats
      prisma.submission.count({ where: { status: 'pending' } }),
      prisma.submission.count({ where: { status: 'approved' } }),
      prisma.submission.count({ where: { status: 'rejected' } }),
      
      // Platform breakdown
      prisma.inspiration.groupBy({
        by: ['platform'],
        _count: { _all: true },
      }),
      
      // Daily stats for the last 30 days
      prisma.$queryRaw`
        SELECT DATE(scraped_at) as date, COUNT(*) as count
        FROM inspirations 
        WHERE scraped_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(scraped_at)
        ORDER BY date DESC
      `,
      
      // Monthly stats for the last 12 months
      prisma.$queryRaw`
        SELECT DATE_TRUNC('month', scraped_at) as month, COUNT(*) as count
        FROM inspirations 
        WHERE scraped_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', scraped_at)
        ORDER BY month DESC
      `,
    ]);

    // Calculate growth rates
    const lastWeekInspirations = await prisma.inspiration.count({
      where: {
        scrapedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const previousWeekInspirations = await prisma.inspiration.count({
      where: {
        scrapedAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const weeklyGrowth = previousWeekInspirations > 0 
      ? ((lastWeekInspirations - previousWeekInspirations) / previousWeekInspirations) * 100
      : 0;

    // Top performing inspirations
    const topInspirations = await prisma.inspiration.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        platform: true,
        score: true,
        authorName: true,
        thumbnailUrl: true,
      },
    });

    // Recent award picks
    const recentAwards = await prisma.dailyCuration.findMany({
      orderBy: { date: 'desc' },
      take: 7,
    });

    return NextResponse.json({
      overview: {
        totalInspirations,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
        lastWeekInspirations,
      },
      platformStats: platformStats.map(stat => ({
        platform: stat.platform,
        count: stat._count._all,
      })),
      dailyStats: (dailyStats as any[]).map((stat: any) => ({
        date: stat.date,
        count: parseInt(stat.count),
      })),
      monthlyStats: (monthlyStats as any[]).reduce((acc: any, stat: any) => {
        const month = new Date(stat.month).toISOString().slice(0, 7);
        acc[month] = parseInt(stat.count);
        return acc;
      }, {} as Record<string, number>),
      topInspirations,
      recentAwards,
    });
  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}