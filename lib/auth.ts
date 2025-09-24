import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Enhanced security configurations
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const SESSION_DURATION = '15m'; // Access token duration
const REFRESH_DURATION = '7d'; // Refresh token duration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: SESSION_DURATION });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_DURATION });
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as any;
    if (payload.type !== 'refresh') return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(token?: string) {
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, name: true, createdAt: true, updatedAt: true },
  });

  return user;
}

// Enhanced security functions
export async function logLoginAttempt(email: string, success: boolean, ip?: string) {
  // In a production app, you'd log this to a security audit table
  console.log(`Login attempt for ${email}: ${success ? 'SUCCESS' : 'FAILED'} from IP: ${ip || 'unknown'}`);
}

export async function requireAdminAuth(request: Request): Promise<{ user: any; error?: Response }> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const user = await getCurrentUser(token);

  if (!user) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  if (user.role !== 'admin') {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  return { user };
}