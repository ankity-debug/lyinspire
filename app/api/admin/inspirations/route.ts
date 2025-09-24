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

    const inspirations = await prisma.inspiration.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(inspirations);
  } catch (error) {
    console.error('Admin inspirations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}