import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { comparePassword, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(user.id);
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return NextResponse.json({ token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}