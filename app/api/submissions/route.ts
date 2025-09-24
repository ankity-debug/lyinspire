import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const submissionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  contentUrl: z.string().url(),
  submitterName: z.string().min(1).max(100),
  submitterEmail: z.string().email(),
  platform: z.string().min(1),
  tags: z.array(z.string()).min(1).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = submissionSchema.parse(body);

    const submission = await prisma.submission.create({
      data,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Submission API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}