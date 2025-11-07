import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUsers, saveUsers, User } from './db';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthToken {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: { id: string; email: string }): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch {
    return null;
  }
}

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const users = await getUsers();
  return users.find(u => u.id === decoded.userId) || null;
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete('auth-token');
}

