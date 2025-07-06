// Handles POST to generate tasks using Gemini API
// Requires Firebase Auth (to be implemented)
import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '../_utils/verifyFirebaseToken';

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

    // Determine prompt based on optional count
    let prompt;
    if (body.count && Number.isInteger(body.count) && body.count > 0) {
      prompt = `if (no actionable tasks can be generated for this goal: ${body.topic} and if ${body.topic} is nothing related to a goal) then return 'false' (nothing other than 'false'), otherwise Generate a list of ${body.count} concise, actionable tasks to learn about ${body.topic}. Return each task as a separate line, with no numbering, no formatting, and do NOT group multiple tasks in a single line. Each line should be a single, actionable task.`;
    } else {
      prompt = `if (no actionable tasks can be generated for this goal: ${body.topic} and if ${body.topic} is nothing related to a goal) then return 'false' (nothing other than 'false'), otherwise Generate as many concise, actionable tasks as possible to learn about ${body.topic}. Return each task as a separate line, with no numbering, no formatting, and do NOT group multiple tasks in a single line. Each line should be a single, actionable task.`;
    }

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    const geminiData = await geminiRes.json();

    const resp = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (resp.trim() === 'false' || resp.trim() === 'false\n') {
      return NextResponse.json({ tasks: false });
    }

    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const generatedTasks = text.split('\n').map((t: string) => t.trim()).filter(Boolean);

    // Only return generated tasks, do not insert into the database

    return NextResponse.json({ tasks: generatedTasks });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
} 