// Handles GET (list all tasks) and POST (create task)
// Requires Firebase Auth (to be implemented)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../_utils/verifyFirebaseToken';
import { z } from 'zod';

const taskSchema = z.object({
  content: z.string().min(1).max(255),
  category: z.string().max(50).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    console.log('Authorization header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('Missing Authorization header');
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
      console.log('Token verification failed');
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    console.log('Token verified for user:', decoded.uid);

    // Find user by Firebase UID, create if not exists
    try {
      const userRows = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid));
      console.log('User query result:', userRows.length, 'rows found');
      
      let user = userRows[0];
      if (!user) {
        console.log('Creating new user for Firebase UID:', decoded.uid);
        const inserted = await db.insert(users).values({
          firebaseUid: decoded.uid,
          email: decoded.email || '',
        }).returning();
        user = inserted[0];
        console.log('New user created with ID:', user.id);
      } else {
        console.log('Existing user found with ID:', user.id);
      }

      // Filtering
      const { searchParams } = new URL(req.url);
      const completedParam = searchParams.get('completed');
      const categoryParam = searchParams.get('category');

      const conditions = [eq(tasks.userId, user.id)];
      if (completedParam !== null) {
        const completed = completedParam === 'true';
        conditions.push(eq(tasks.completed, completed));
      }
      if (categoryParam !== null) {
        conditions.push(eq(tasks.category, categoryParam));
      }
      const whereClause = and(...conditions);

      // Get filtered tasks for this user
      const userTasks = await db.select().from(tasks).where(whereClause);
      console.log('Retrieved tasks for user:', userTasks.length);
      return NextResponse.json(userTasks);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Database error', details: String(dbError) }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    // Find user by Firebase UID
    const userRows = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid));
    let user = userRows[0];
    if (!user) {
      // Create user if not exists
      const inserted = await db.insert(users).values({
        firebaseUid: decoded.uid,
        email: decoded.email || '',
      }).returning();
      user = inserted[0];
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const result = taskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.errors }, { status: 400 });
    }
    const newTask = await db.insert(tasks).values({
      userId: user.id,
      content: result.data.content,
      completed: false,
      category: result.data.category || null,
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : null,
    }).returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
} 