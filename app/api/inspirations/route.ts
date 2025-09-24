import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const platform = searchParams.get('platform');
    const tags = searchParams.get('tags');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: any = { archived: false };

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Platform filter
    if (platform) {
      where.platform = platform;
    }

    // Tags filter
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagList };
    }

    // Date filter
    if (date) {
      const now = new Date();
      let startDate: Date;

      switch (date) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      where.publishedAt = { gte: startDate };
    }

    const total = await prisma.inspiration.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const inspirations = await prisma.inspiration.findMany({
      where,
      orderBy: { score: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: inspirations,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    console.error('Inspirations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}