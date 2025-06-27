import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../_utils/verifyFirebaseToken';

export async function POST(req: NextRequest) {
    console.log("Database url: " + process.env.DATABASE_URL)
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
    if (userRows.length > 0) {
        return NextResponse.json({ success: true, user: userRows[0] });
    }

    const inserted = await db.insert(users).values({
        firebaseUid: decoded.uid,
        email: decoded.email || '',
    }).returning();
    return NextResponse.json({ success: true, user: inserted[0] });
} 