import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: params.id },
      select: { platform: true, tags: true },
    });

    if (!inspiration) {
      return NextResponse.json([]);
    }

    const related = await prisma.inspiration.findMany({
      where: {
        AND: [
          { id: { not: params.id } },
          { archived: false },
          {
            OR: [
              { platform: inspiration.platform },
              { tags: { hasSome: inspiration.tags } },
            ],
          },
        ],
      },
      orderBy: { score: 'desc' },
      take: 6,
    });

    return NextResponse.json(related);
  } catch (error) {
    console.error('Related inspirations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}