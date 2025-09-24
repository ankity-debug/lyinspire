import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for today's curation to avoid repeated database hits
let todayCache: {
  date: string;
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache for today's content

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().split('T')[0];

    // Check cache
    if (todayCache && 
        todayCache.date === dateKey && 
        Date.now() - todayCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...todayCache.data,
        cached: true,
      });
    }

    // Get today's curation with optimized query
    let curation = await prisma.dailyCuration.findUnique({
      where: { date: today },
      select: {
        id: true,
        date: true,
        awardPickId: true,
        top10Ids: true,
      },
    });

    if (!curation) {
      // Create curation for today if it doesn't exist using optimized query
      const topInspirations = await prisma.inspiration.findMany({
        where: { 
          archived: false,
          score: { gte: 60 }, // Only consider high-quality content
        },
        orderBy: [
          { score: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: 15, // Get a few extra for diversity
        select: {
          id: true,
          score: true,
          platform: true,
          authorName: true,
        },
      });

      // Apply diversity constraints for better curation
      const diverseInspirations = applyDiversityConstraints(topInspirations);
      
      const awardPickId = diverseInspirations[0]?.id;
      const top10Ids = diverseInspirations.slice(1, 11).map(i => i.id);

      curation = await prisma.dailyCuration.create({
        data: {
          date: today,
          awardPickId,
          top10Ids,
        },
        select: {
          id: true,
          date: true,
          awardPickId: true,
          top10Ids: true,
        },
      });
    }

    // Fetch inspirations in batch for better performance
    const inspirationIds = [
      ...(curation.awardPickId ? [curation.awardPickId] : []),
      ...curation.top10Ids,
    ];

    const inspirations = await prisma.inspiration.findMany({
      where: {
        id: { in: inspirationIds },
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        contentUrl: true,
        platform: true,
        authorName: true,
        authorUrl: true,
        tags: true,
        score: true,
        publishedAt: true,
      },
    });

    // Create lookup map for efficient access
    const inspirationMap = new Map(inspirations.map(i => [i.id, i]));

    const awardPick = curation.awardPickId 
      ? inspirationMap.get(curation.awardPickId) || null
      : null;

    const top10 = curation.top10Ids
      .map(id => inspirationMap.get(id))
      .filter(Boolean)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0));

    const result = {
      awardPick,
      top10,
      cached: false,
    };

    // Update cache
    todayCache = {
      date: dateKey,
      data: result,
      timestamp: Date.now(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Today API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function applyDiversityConstraints(inspirations: any[]): any[] {
  const result: any[] = [];
  const platformCounts: Record<string, number> = {};
  const authorCounts: Record<string, number> = {};

  for (const inspiration of inspirations) {
    const platform = inspiration.platform;
    const author = inspiration.authorName;

    // Platform diversity: max 3 per platform
    if (platformCounts[platform] >= 3) continue;

    // Author diversity: max 2 per author
    if (author && authorCounts[author] >= 2) continue;

    result.push(inspiration);
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    if (author) {
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    }

    // Stop when we have enough
    if (result.length >= 11) break;
  }

  return result;
}