import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdminAuth(request);
    if (error) return error;

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const curation = await prisma.dailyCuration.findUnique({
      where: { date: targetDate },
    });

    let awardPick: any = null;
    let top10Inspirations: any[] = [];

    if (curation?.awardPickId) {
      awardPick = await prisma.inspiration.findUnique({
        where: { id: curation.awardPickId },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          platform: true,
          authorName: true,
          score: true,
        },
      });
    }

    if (curation?.top10Ids && curation.top10Ids.length > 0) {
      top10Inspirations = await prisma.inspiration.findMany({
        where: { id: { in: curation.top10Ids } },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          platform: true,
          authorName: true,
          score: true,
        },
        orderBy: { score: 'desc' },
      });
    }

    return NextResponse.json({
      date: targetDate,
      awardPick,
      top10Inspirations,
      hasData: !!curation,
    });
  } catch (error) {
    console.error('Admin curation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdminAuth(request);
    if (error) return error;

    const { date, awardPickId, top10Ids } = await request.json();
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const curation = await prisma.dailyCuration.upsert({
      where: { date: targetDate },
      update: {
        awardPickId: awardPickId || null,
        top10Ids: top10Ids || [],
      },
      create: {
        date: targetDate,
        awardPickId: awardPickId || null,
        top10Ids: top10Ids || [],
      },
    });

    return NextResponse.json({ success: true, curation });
  } catch (error) {
    console.error('Admin curation update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}