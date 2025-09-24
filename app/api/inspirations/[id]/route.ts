import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: params.id },
      include: { curator: { select: { name: true, email: true } } },
    });

    if (!inspiration) {
      return NextResponse.json(
        { error: 'Inspiration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(inspiration);
  } catch (error) {
    console.error('Inspiration detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}