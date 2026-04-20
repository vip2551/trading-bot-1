import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

// POST - Sync database schema using Prisma
export async function POST() {
  try {
    console.log('🔄 Syncing database schema...');
    
    const { stdout, stderr } = await execAsync('bunx prisma db push --accept-data-loss --skip-generate', {
      env: process.env,
      timeout: 120000,
    });

    console.log('✅ Schema sync complete');

    return NextResponse.json({
      success: true,
      message: 'Database schema synced successfully!',
      output: stdout || stderr,
    });
  } catch (error: any) {
    console.error('❌ Sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Check Railway logs for more details',
    }, { status: 500 });
  }
}

// GET - Check database tables
export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    
    const tables = await db.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    return NextResponse.json({
      success: true,
      tableCount: tables.length,
      tables: tables.map(t => t.table_name),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
