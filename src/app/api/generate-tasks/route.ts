// Handles POST to generate tasks using Gemini API
// Requires Firebase Auth (to be implemented)
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../_utils/verifyFirebaseToken';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

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

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    if (!body.topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `Generate a list of 5 concise, actionable tasks to learn about ${body.topic}. Return only the tasks, no numbering or formatting.`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    const geminiData = await geminiRes.json();
    console.log('Gemini API response:', geminiData);
    if (geminiData?.candidates?.[0]?.content) {
      console.log('Gemini candidate content:', geminiData.candidates[0].content);
    }
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const generatedTasks = text.split('\n').map((t:string) => t.trim()).filter(Boolean);

    // Only return generated tasks, do not insert into the database
    return NextResponse.json({ tasks: generatedTasks });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
} 