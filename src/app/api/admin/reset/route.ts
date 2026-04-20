import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'trading-bot-salt').digest('hex');
}

// POST - Reset admin password
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { setupKey, newPassword } = body;

    // Check setup key
    const validSetupKey = process.env.ADMIN_SETUP_KEY || 'trading-bot-admin-2024';
    
    if (setupKey !== validSetupKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid setup key' 
      }, { status: 403 });
    }

    const password = newPassword || 'Admin@123456';
    const hashedPassword = hashPassword(password);

    // Find admin
    const admin = await db.user.findFirst({
      where: { isAdmin: true }
    });

    if (!admin) {
      return NextResponse.json({ 
        success: false,
        error: 'Admin not found' 
      }, { status: 404 });
    }

    // Update password
    await db.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      admin: {
        email: admin.email,
        password: password
      }
    });

  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// GET - Check admin status
export async function GET() {
  try {
    const admin = await db.user.findFirst({
      where: { isAdmin: true },
      select: { 
        id: true, 
        email: true, 
        name: true,
        password: true,
        createdAt: true 
      }
    });

    return NextResponse.json({
      adminExists: !!admin,
      hasPassword: !!admin?.password,
      admin: admin ? {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        passwordLength: admin.password?.length || 0
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
