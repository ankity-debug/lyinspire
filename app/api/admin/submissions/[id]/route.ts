import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await getCurrentUser(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status, rejectionReason } = await request.json();

    const submission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: user.id,
        rejectionReason: status === 'rejected' ? rejectionReason : null,
      },
    });

    // If approved, create an inspiration
    if (status === 'approved') {
      await prisma.inspiration.create({
        data: {
          title: submission.title,
          description: submission.description,
          contentUrl: submission.contentUrl,
          platform: submission.platform,
          tags: submission.tags,
          score: 50, // Default score for submissions
          publishedAt: new Date(),
          curatedBy: user.id,
        },
      });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Admin submission update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}