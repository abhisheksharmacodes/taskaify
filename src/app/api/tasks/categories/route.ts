import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../_utils/verifyFirebaseToken';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const decoded = await verifyFirebaseToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Find user by Firebase UID
  const userRows = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid));
  if (userRows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const user = userRows[0];

  // Get all non-null categories for this user
  const userTasks = await db.select({ category: tasks.category }).from(tasks)
    .where(eq(tasks.userId, user.id));
  const categories = Array.from(new Set(userTasks.map(t => t.category).filter(Boolean)));
  return NextResponse.json(categories);
} 