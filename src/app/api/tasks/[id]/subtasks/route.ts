import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subtasks, users, tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../_utils/verifyFirebaseToken';
import { z } from 'zod';

const subtaskSchema = z.object({
  content: z.string().min(1).max(255),
  completed: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
  // Check that the task belongs to the user
  const taskRows = await db.select().from(tasks).where(and(eq(tasks.id, Number(params.id)), eq(tasks.userId, user.id)));
  if (taskRows.length === 0) {
    return NextResponse.json({ error: 'Task not found or not yours' }, { status: 404 });
  }
  // Get all subtasks for this task
  const allSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, Number(params.id)));
  return NextResponse.json(allSubtasks);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  // Check that the task belongs to the user
  const taskRows = await db.select().from(tasks).where(and(eq(tasks.id, Number(params.id)), eq(tasks.userId, user.id)));
  if (taskRows.length === 0) {
    return NextResponse.json({ error: 'Task not found or not yours' }, { status: 404 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  const result = subtaskSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.errors }, { status: 400 });
  }
  const newSubtask = await db.insert(subtasks).values({
    taskId: Number(params.id),
    content: result.data.content,
    completed: result.data.completed ?? false,
  }).returning();
  return NextResponse.json(newSubtask[0], { status: 201 });
} 