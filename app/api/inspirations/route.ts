import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams);
  params.sort();
  return params.toString();
}

function getCachedResult(key: string) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedResult(key: string, data: any) {
  queryCache.set(key, { data, timestamp: Date.now() });
  
  // Clean up old cache entries
  if (queryCache.size > 100) {
    const entries = Array.from(queryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 50; i++) {
      queryCache.delete(entries[i][0]);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = getCacheKey(searchParams);
    
    // Check cache for non-search queries
    const search = searchParams.get('search');
    if (!search) {
      const cached = getCachedResult(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const platform = searchParams.get('platform');
    const tags = searchParams.get('tags');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50); // Cap limit for performance

    // Build optimized where clause for better index usage
    const where: any = { archived: false };

    // Platform filter (use this early for better index performance)
    if (platform) {
      where.platform = platform;
    }

    // Date filter (optimized for publishedAt index)
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

    // Tags filter (optimized for GIN index)
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList };
      }
    }

    // Search filter (most expensive, apply last)
    if (search) {
      const searchTerm = search.trim();
      if (searchTerm) {
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { hasSome: [searchTerm] } },
        ];
      }
    }

    // Use estimated count for better performance on large datasets
    const skip = (page - 1) * limit;
    const takeWithBuffer = limit + 1; // Take one extra to check if there are more

    // Execute optimized query with compound ordering for index usage
    const inspirations = await prisma.inspiration.findMany({
      where,
      orderBy: [
        { score: 'desc' },
        { publishedAt: 'desc' }, // Secondary sort for tie-breaking
      ],
      skip,
      take: takeWithBuffer,
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
        createdAt: true,
      },
    });

    const hasMore = inspirations.length > limit;
    const data = hasMore ? inspirations.slice(0, limit) : inspirations;

    // Only do expensive count for first page or when specifically needed
    let total = 0;
    let totalPages = 0;
    
    if (page === 1 || page <= 5) {
      // For early pages, get actual count
      total = await prisma.inspiration.count({ where });
      totalPages = Math.ceil(total / limit);
    } else {
      // For later pages, provide estimated values
      total = (page - 1) * limit + data.length + (hasMore ? limit : 0);
      totalPages = Math.ceil(total / limit);
    }

    const result = {
      data,
      total,
      page,
      totalPages,
      hasMore,
      cached: false,
    };

    // Cache non-search results
    if (!search) {
      setCachedResult(cacheKey, result);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Inspirations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}