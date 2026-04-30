import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password-hash';
import { apiRateLimiter } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const rateCheck = apiRateLimiter.check(req);
    if (!rateCheck.success) {
      return NextResponse.json({
        success: false,
        error: 'Too many requests'
      }, { status: 429 });
    }

    const { email, currentPassword, newPassword } = await req.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, { status: 400 });
    }

    // ✅ التحقق من قوة كلمة المرور الجديدة
    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters'
      }, { status: 400 });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasNumber) {
      return NextResponse.json({
        success: false,
        error: 'Password must contain at least one uppercase letter and one number'
      }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.password) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // ✅ التحقق من كلمة المرور الحالية
    const isValid = await verifyPassword(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Current password is incorrect'
      }, { status: 401 });
    }

    // ✅ bcrypt
    const hashedPassword = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}