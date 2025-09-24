import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await getCurrentUser(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const totalInspirations = await prisma.inspiration.count();
    const pendingSubmissions = await prisma.submission.count({
      where: { status: 'pending' },
    });

    // Mock stats for views and growth
    const todayViews = Math.floor(Math.random() * 10000) + 5000;
    const weeklyGrowth = Math.floor(Math.random() * 20) + 5;

    return NextResponse.json({
      totalInspirations,
      pendingSubmissions,
      todayViews,
      weeklyGrowth,
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}