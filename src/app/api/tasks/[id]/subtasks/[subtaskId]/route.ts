import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subtasks, users, tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyFirebaseToken } from '../../../../_utils/verifyFirebaseToken';
import { z } from 'zod';

const subtaskUpdateSchema = z.object({
  content: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string, subtaskId: string }> }) {
  const { id, subtaskId } = await params;
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
  const taskRows = await db.select().from(tasks).where(and(eq(tasks.id, Number(id)), eq(tasks.userId, user.id)));
  if (taskRows.length === 0) {
    return NextResponse.json({ error: 'Task not found or not yours' }, { status: 404 });
  }
  // Check that the subtask belongs to the task
  const subtaskRows = await db.select().from(subtasks).where(and(eq(subtasks.id, Number(subtaskId)), eq(subtasks.taskId, Number(id))));
  if (subtaskRows.length === 0) {
    return NextResponse.json({ error: 'Subtask not found or not yours' }, { status: 404 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }
  const result = subtaskUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload', details: result.error.errors }, { status: 400 });
  }
  const updateData: Record<string, unknown> = {};
  if (result.data.content !== undefined) updateData.content = result.data.content;
  if (result.data.completed !== undefined) updateData.completed = result.data.completed;
  updateData.updatedAt = new Date();
  const updated = await db.update(subtasks)
    .set(updateData)
    .where(and(eq(subtasks.id, Number(subtaskId)), eq(subtasks.taskId, Number(id))))
    .returning();
  if (updated.length === 0) {
    return NextResponse.json({ error: 'Subtask not found or not yours' }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, subtaskId: string }> }) {
  const { id, subtaskId } = await params;
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
  const taskRows = await db.select().from(tasks).where(and(eq(tasks.id, Number(id)), eq(tasks.userId, user.id)));
  if (taskRows.length === 0) {
    return NextResponse.json({ error: 'Task not found or not yours' }, { status: 404 });
  }
  // Check that the subtask belongs to the task
  const subtaskRows = await db.select().from(subtasks).where(and(eq(subtasks.id, Number(subtaskId)), eq(subtasks.taskId, Number(id))));
  if (subtaskRows.length === 0) {
    return NextResponse.json({ error: 'Subtask not found or not yours' }, { status: 404 });
  }
  const deleted = await db.delete(subtasks)
    .where(and(eq(subtasks.id, Number(subtaskId)), eq(subtasks.taskId, Number(id))))
    .returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Subtask not found or not yours' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
} 