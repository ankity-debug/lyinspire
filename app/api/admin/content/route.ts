import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdminAuth(request);
    if (error) return error;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');
    const platform = url.searchParams.get('platform');
    const archived = url.searchParams.get('archived') === 'true';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where: any = { archived };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (platform && platform !== 'all') {
      where.platform = platform;
    }

    const [inspirations, total] = await Promise.all([
      prisma.inspiration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
          scrapedAt: true,
          archived: true,
          curatedBy: true,
          curator: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.inspiration.count({ where }),
    ]);

    return NextResponse.json({
      inspirations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin content API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requireAdminAuth(request);
    if (error) return error;

    const { ids, action, data } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing inspiration IDs' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'archive':
        updateData = { archived: true };
        break;
      case 'unarchive':
        updateData = { archived: false };
        break;
      case 'update':
        if (data) {
          updateData = {
            ...data,
            updatedAt: new Date(),
          };
        }
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const result = await prisma.inspiration.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      action,
    });
  } catch (error) {
    console.error('Admin content update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAdminAuth(request);
    if (error) return error;

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing inspiration IDs' },
        { status: 400 }
      );
    }

    const result = await prisma.inspiration.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error('Admin content delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}