import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../_utils/verifyFirebaseToken';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    console.log('Progress API - Authorization header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('Progress API - Missing Authorization header');
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Progress API - Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
      console.log('Progress API - Token verification failed');
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    console.log('Progress API - Token verified for user:', decoded.uid);

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.firebaseUid, decoded.uid)
      });
      console.log('Progress API - User query result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        console.log('Progress API - User not found for Firebase UID:', decoded.uid);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const result = await db.select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${tasks.completed} then 1 else 0 end)`,
      }).from(tasks).where(eq(tasks.userId, user.id));

      const progress = result[0];
      console.log('Progress API - Retrieved progress for user:', progress);
      return NextResponse.json(progress);
    } catch (dbError) {
      console.error('Progress API - Database error:', dbError);
      return NextResponse.json({ error: 'Database error', details: String(dbError) }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/tasks/progress:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
} 