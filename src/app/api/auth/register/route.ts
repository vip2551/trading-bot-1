import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password-hash';
import { registerRateLimiter } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = registerRateLimiter.check(req);
    if (!rateCheck.success) {
      return NextResponse.json({
        success: false,
        error: 'Too many registration attempts. Please try again later.'
      }, { status: 429 });
    }

    const { name, email, password } = await req.json();

    // التحقق من البيانات
    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, { status: 400 });
    }

    // ✅ كلمة المرور 8 أحرف على الأقل
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters'
      }, { status: 400 });
    }

    // ✅ كلمة المرور قوية (حرف كبير + رقم)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasNumber) {
      return NextResponse.json({
        success: false,
        error: 'Password must contain at least one uppercase letter and one number'
      }, { status: 400 });
    }

    // التحقق من عدم وجود المستخدم
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Email already registered'
      }, { status: 400 });
    }

    // ✅ bcrypt
    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user'
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}