import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

  // Get all categories for this user
  const userCategories = await db.select().from(categories).where(eq(categories.userId, user.id));
  return NextResponse.json(userCategories.map(c => c.name));
}

export async function POST(req: NextRequest) {
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

  const { name } = await req.json();
  if (!name || typeof name !== 'string' || name.length > 50) {
    return NextResponse.json({ error: 'Invalid category name' }, { status: 400 });
  }

  // Insert category if it doesn't exist
  try {
    await db.insert(categories).values({ userId: user.id, name });
  } catch (e: any) {
    // Ignore duplicate error
  }
  return NextResponse.json({ success: true });
} 