import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = await getCurrentUser(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Implement actual scraping trigger
    // This would typically trigger a background job or webhook
    console.log('Manual scraping triggered by admin:', user.id);

    return NextResponse.json({ success: true, message: 'Scraping initiated' });
  } catch (error) {
    console.error('Admin ingest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}