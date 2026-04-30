import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, blockDurationMs = windowMs * 4 } = config;

  return {
    check: (req: NextRequest, identifier?: string): { 
      success: boolean; 
      remaining: number; 
      resetTime: number;
      blocked: boolean;
    } => {
      const ip = identifier || 
                 req.ip || 
                 req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      
      const key = `rate-limit:${ip}`;
      const now = Date.now();
      const entry = rateLimitStore.get(key);
      
      // إذا محجوب
      if (entry?.blocked && now < entry.resetTime) {
        return { 
          success: false, 
          remaining: 0, 
          resetTime: entry.resetTime,
          blocked: true
        };
      }
      
      // إذا انتهت النافذة الزمنية
      if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs,
          blocked: false
        });
        return { 
          success: true, 
          remaining: maxRequests - 1, 
          resetTime: now + windowMs,
          blocked: false
        };
      }
      
      // إذا وصل للحد الأقصى
      if (entry.count >= maxRequests) {
        entry.blocked = true;
        entry.resetTime = now + blockDurationMs;
        return { 
          success: false, 
          remaining: 0, 
          resetTime: entry.resetTime,
          blocked: true
        };
      }
      
      entry.count++;
      return { 
        success: true, 
        remaining: maxRequests - entry.count, 
        resetTime: entry.resetTime,
        blocked: false
      };
    },
    
    reset: (req: NextRequest, identifier?: string): void => {
      const ip = identifier || 
                 req.ip || 
                 req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 'unknown';
      rateLimitStore.delete(`rate-limit:${ip}`);
    }
  };
}

// Rate limiters
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  maxRequests: 5,           // 5 محاولات
  blockDurationMs: 60 * 60 * 1000 // حجب ساعة
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,      // دقيقة
  maxRequests: 100          // 100 طلب
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة
  maxRequests: 3,           // 3 تسجيلات
  blockDurationMs: 24 * 60 * 60 * 1000 // حجب 24 ساعة
});

// تنظيف الذاكرة كل ساعة
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);