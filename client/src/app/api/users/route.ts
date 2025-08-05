import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../_utils/verifyFirebaseToken';

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

    const userRows = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid));
    if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: userRows[0] });
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

    let name = '';
    try {
        const body = await req.json();
        name = body.name || '';
    } catch {}

    const userRows = await db.select().from(users).where(eq(users.firebaseUid, decoded.uid));
    if (userRows.length > 0) {
        // If name is provided and not already set, update it
        if (name && !userRows[0].name) {
            const updated = await db.update(users)
                .set({ name })
                .where(eq(users.firebaseUid, decoded.uid))
                .returning();
            return NextResponse.json({ success: true, user: updated[0] });
        }
        return NextResponse.json({ success: true, user: userRows[0] });
    }

    // Create user with name
    const inserted = await db.insert(users).values({
        firebaseUid: decoded.uid,
        email: decoded.email || '',
        name: name || null,
    }).returning();
    return NextResponse.json({ success: true, user: inserted[0] });
}

export async function PUT(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Try to get name from request body
    let name = '';
    try {
        const body = await req.json();
        name = body.name || '';
    } catch {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    if (!name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updated = await db.update(users)
        .set({ name: name.trim() })
        .where(eq(users.firebaseUid, decoded.uid))
        .returning();

    if (updated.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated[0] });
} 