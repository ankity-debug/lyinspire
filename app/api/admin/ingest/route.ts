import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { spawn } from 'child_process';
import { promisify } from 'util';

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

    const { platform } = await request.json();

    console.log('Manual scraping triggered by admin:', user.id, 'Platform:', platform || 'all');

    // Trigger the Python scraper in the background
    const pythonProcess = spawn('python3', [
      'scrapers/run_scrapers.py',
      ...(platform ? ['--platform', platform] : [])
    ], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    // Set up process handlers
    pythonProcess.stdout.on('data', (data) => {
      console.log('Scraper output:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Scraper error:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      console.log('Scraper process finished with code:', code);
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Scraping initiated',
      platform: platform || 'all platforms'
    });
  } catch (error) {
    console.error('Admin ingest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}