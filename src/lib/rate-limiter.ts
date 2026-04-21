/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ⏱️ RATE LIMITER - Webhook Protection
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * حماية الـ Webhook من الهجمات
 * - حد أقصى للطلبات لكل IP
 * - حظر تلقائي للـ IPs المشبوهة
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
  blockedUntil?: number;
}

interface RateLimitConfig {
  windowMs: number;        // نافزة الوقت (milliseconds)
  maxRequests: number;     // أقصى عدد طلبات
  blockDurationMs: number; // مدة الحظر
  whitelistIPs?: string[]; // IPs موثوقة
}

class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: config?.windowMs || 60_000,          // دقيقة واحدة
      maxRequests: config?.maxRequests || 10,         // 10 طلبات لكل دقيقة
      blockDurationMs: config?.blockDurationMs || 300_000, // حظر 5 دقائق
      whitelistIPs: config?.whitelistIPs || ['127.0.0.1', '::1']
    };

    // تنظيف الذاكرة كل 5 دقائق
    this.startCleanup();
  }

  /**
   * التحقق من معدل الطلبات
   */
  check(ip: string): { allowed: boolean; remaining: number; resetIn?: number; reason?: string } {
    const now = Date.now();
    
    // IPs الموثوقة لا تخضع للحد
    if (this.config.whitelistIPs?.includes(ip)) {
      return { allowed: true, remaining: this.config.maxRequests };
    }

    let entry = this.entries.get(ip);

    // إنشاء إدخال جديد
    if (!entry) {
      entry = {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        blocked: false
      };
      this.entries.set(ip, entry);
    }

    // التحقق من الحظر
    if (entry.blocked) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        const resetIn = Math.ceil((entry.blockedUntil - now) / 1000);
        return { allowed: false, remaining: 0, resetIn, reason: 'IP blocked' };
      } else {
        // انتهى الحظر
        entry.blocked = false;
        entry.blockedUntil = undefined;
        entry.count = 0;
        entry.firstRequest = now;
      }
    }

    // إعادة تعيين النافذة إذا انتهت
    if (now - entry.firstRequest > this.config.windowMs) {
      entry.count = 0;
      entry.firstRequest = now;
    }

    // التحقق من الحد
    if (entry.count >= this.config.maxRequests) {
      // حظر الـ IP
      entry.blocked = true;
      entry.blockedUntil = now + this.config.blockDurationMs;
      
      console.log(`[RATE-LIMIT] 🚫 IP ${ip} blocked for ${this.config.blockDurationMs / 1000}s`);
      
      const resetIn = Math.ceil(this.config.blockDurationMs / 1000);
      return { allowed: false, remaining: 0, resetIn, reason: 'Rate limit exceeded' };
    }

    // زيادة العداد
    entry.count++;
    entry.lastRequest = now;

    const remaining = this.config.maxRequests - entry.count;
    const resetIn = Math.ceil((this.config.windowMs - (now - entry.firstRequest)) / 1000);

    return { allowed: true, remaining, resetIn };
  }

  /**
   * التحقق من معدل الطلبات (async version)
   */
  async checkAsync(ip: string): Promise<{ allowed: boolean; remaining: number; resetIn?: number; reason?: string }> {
    return this.check(ip);
  }

  /**
   * إزالة حظر IP
   */
  unblock(ip: string): boolean {
    const entry = this.entries.get(ip);
    if (entry) {
      entry.blocked = false;
      entry.blockedUntil = undefined;
      return true;
    }
    return false;
  }

  /**
   * حظر IP يدوياً
   */
  block(ip: string, durationMs?: number): void {
    const now = Date.now();
    let entry = this.entries.get(ip);
    
    if (!entry) {
      entry = {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        blocked: true,
        blockedUntil: now + (durationMs || this.config.blockDurationMs)
      };
      this.entries.set(ip, entry);
    } else {
      entry.blocked = true;
      entry.blockedUntil = now + (durationMs || this.config.blockDurationMs);
    }
    
    console.log(`[RATE-LIMIT] 🚫 IP ${ip} manually blocked`);
  }

  /**
   * الحصول على إحصائيات
   */
  getStats(): { totalIPs: number; blockedIPs: number; activeIPs: number } {
    let blocked = 0;
    let active = 0;
    const now = Date.now();

    this.entries.forEach(entry => {
      if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
        blocked++;
      } else if (now - entry.lastRequest < this.config.windowMs) {
        active++;
      }
    });

    return {
      totalIPs: this.entries.size,
      blockedIPs: blocked,
      activeIPs: active
    };
  }

  /**
   * تنظيف الذاكرة
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = Math.max(this.config.windowMs, this.config.blockDurationMs) * 2;

      this.entries.forEach((entry, ip) => {
        // حذف الإدخالات القديمة
        if (now - entry.lastRequest > maxAge) {
          this.entries.delete(ip);
        }
      });

      console.log(`[RATE-LIMIT] 🧹 Cleanup: ${this.entries.size} IPs tracked`);
    }, 300_000); // كل 5 دقائق
  }

  /**
   * إيقاف التنظيف
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// إنشاء مثيلات جاهزة للاستخدام
export const webhookRateLimiter = new RateLimiter({
  windowMs: 60_000,        // دقيقة واحدة
  maxRequests: 10,         // 10 طلبات لكل دقيقة
  blockDurationMs: 300_000 // حظر 5 دقائق
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60_000,        // دقيقة واحدة
  maxRequests: 60,         // 60 طلب لكل دقيقة
  blockDurationMs: 60_000  // حظر دقيقة واحدة
});

// Export the class for custom configurations
export { RateLimiter };
export default RateLimiter;
