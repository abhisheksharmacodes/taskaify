import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Test 1: Check if we can connect to the database
    console.log('Testing database connection...');
    
    // Test 2: Check table structure
    console.log('Checking table structure...');
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:', tableInfo.rows);
    
    // Test 3: Try to select from users table
    console.log('Testing select from users table...');
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log('User count:', userCount[0].count);
    
    return NextResponse.json({
      success: true,
      tableStructure: tableInfo.rows,
      userCount: userCount[0].count
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: String(error) 
    }, { status: 500 });
  }
} 