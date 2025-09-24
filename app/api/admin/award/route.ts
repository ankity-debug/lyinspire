import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await getCurrentUser(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { inspirationId } = await request.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyCuration.upsert({
      where: { date: today },
      update: { awardPickId: inspirationId },
      create: {
        date: today,
        awardPickId: inspirationId,
        top10Ids: [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin award API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}