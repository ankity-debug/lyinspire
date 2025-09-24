import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's curation
    let curation = await prisma.dailyCuration.findUnique({
      where: { date: today },
    });

    if (!curation) {
      // Create curation for today if it doesn't exist
      const top10 = await prisma.inspiration.findMany({
        where: { archived: false },
        orderBy: { score: 'desc' },
        take: 11,
      });

      const awardPickId = top10[0]?.id;
      const top10Ids = top10.slice(1, 11).map(i => i.id);

      curation = await prisma.dailyCuration.create({
        data: {
          date: today,
          awardPickId,
          top10Ids,
        },
      });
    }

    // Fetch the actual inspirations
    const awardPick = curation.awardPickId
      ? await prisma.inspiration.findUnique({
          where: { id: curation.awardPickId },
        })
      : null;

    const top10 = await prisma.inspiration.findMany({
      where: {
        id: { in: curation.top10Ids },
      },
      orderBy: { score: 'desc' },
    });

    return NextResponse.json({
      awardPick,
      top10,
    });
  } catch (error) {
    console.error('Today API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}