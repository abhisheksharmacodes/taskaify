import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../_utils/verifyFirebaseToken';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    console.log('Decoded UID:', decoded.uid);
    console.log('#############################################################################:', process.env.DATABASE_URL);

    const allUsers = await db.select().from(users);
    console.log('All users in DB:', allUsers);

    const userRows = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid));
    console.log('User rows:', userRows);
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userRows[0];

    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return NextResponse.json({ total, completed, progress });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
} 