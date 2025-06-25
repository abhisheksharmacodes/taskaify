// Handles GET (single task), PUT (update), DELETE (delete)
// Requires Firebase Auth (to be implemented)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../_utils/verifyFirebaseToken';
import { z } from 'zod';

const updateTaskSchema = z.object({
  content: z.string().min(1).max(255).optional(),
  category: z.string().max(50).optional(),
  completed: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
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

  // Find task by id and userId
  const taskRows = await db.select().from(tasks).where(and(eq(tasks.id, Number(params.id)), eq(tasks.userId, user.id)));
  if (taskRows.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  return NextResponse.json(taskRows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

  // Only update if task belongs to user
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  const result = updateTaskSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.errors }, { status: 400 });
  }
  const updateData: any = {};
  if (result.data.content !== undefined) updateData.content = result.data.content;
  if (result.data.completed !== undefined) updateData.completed = result.data.completed;
  if (result.data.category !== undefined) updateData.category = result.data.category;
  if (result.data.dueDate !== undefined) updateData.dueDate = result.data.dueDate ? new Date(result.data.dueDate) : null;
  updateData.updatedAt = new Date();

  const updated = await db.update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, Number(params.id)), eq(tasks.userId, user.id)))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: 'Task not found or not yours' }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

  // Only delete if task belongs to user
  const deleted = await db.delete(tasks)
    .where(and(eq(tasks.id, Number(params.id)), eq(tasks.userId, user.id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Task not found or not yours' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
} 