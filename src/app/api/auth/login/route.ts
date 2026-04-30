import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, needsRehash, hashPassword } from '@/lib/password-hash';
import { loginRateLimiter } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // التحقق من Rate Limiting
    const rateCheck = loginRateLimiter.check(req);
    if (!rateCheck.success) {
      return NextResponse.json({
        success: false,
        error: rateCheck.blocked 
          ? 'Account temporarily locked. Try again later.'
          : 'Too many attempts. Please wait.',
        retryAfter: Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateCheck.resetTime - Date.now()) / 1000))
        }
      });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password required'
      }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.password) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401 });
    }

    // ترحيل كلمة المرور إذا تحتاج rehash
    if (needsRehash(user.password)) {
      const newHash = await hashPassword(password);
      await db.user.update({
        where: { id: user.id },
        data: { password: newHash }
      });
    }

    // إعادة تعيين rate limiter عند النجاح
    loginRateLimiter.reset(req);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}