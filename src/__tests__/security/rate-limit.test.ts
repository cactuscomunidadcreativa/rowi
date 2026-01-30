import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/security/rate-limit';

describe('Rate Limiting', () => {
  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      const config = { limit: 5, windowSeconds: 60 };

      const result1 = checkRateLimit(identifier, config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit(identifier, config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should block requests over limit', () => {
      const identifier = 'test-user-2';
      const config = { limit: 2, windowSeconds: 60 };

      checkRateLimit(identifier, config); // 1
      checkRateLimit(identifier, config); // 2

      const result = checkRateLimit(identifier, config); // 3 - should be blocked
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different identifiers separately', () => {
      const config = { limit: 2, windowSeconds: 60 };

      const result1 = checkRateLimit('user-a', config);
      const result2 = checkRateLimit('user-b', config);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.remaining).toBe(1);
    });

    it('should return resetIn time', () => {
      const identifier = 'test-user-3';
      const config = { limit: 5, windowSeconds: 60 };

      const result = checkRateLimit(identifier, config);
      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(60);
    });
  });

  describe('RATE_LIMITS presets', () => {
    it('should have AUTH preset', () => {
      expect(RATE_LIMITS.AUTH).toBeDefined();
      expect(RATE_LIMITS.AUTH.limit).toBe(5);
      expect(RATE_LIMITS.AUTH.windowSeconds).toBe(60);
    });

    it('should have API preset', () => {
      expect(RATE_LIMITS.API).toBeDefined();
      expect(RATE_LIMITS.API.limit).toBe(100);
    });

    it('should have SENSITIVE preset with very low limit', () => {
      expect(RATE_LIMITS.SENSITIVE).toBeDefined();
      expect(RATE_LIMITS.SENSITIVE.limit).toBe(3);
    });

    it('should have AI preset', () => {
      expect(RATE_LIMITS.AI).toBeDefined();
      expect(RATE_LIMITS.AI.limit).toBe(20);
    });
  });

  describe('getClientIP', () => {
    // Create mock request objects for testing
    const createMockRequest = (headers: Record<string, string> = {}) => ({
      headers: {
        get: (name: string) => headers[name.toLowerCase()] || null,
      },
    }) as unknown as Request;

    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = createMockRequest({
        'x-real-ip': '192.168.1.2',
      });
      expect(getClientIP(request)).toBe('192.168.1.2');
    });

    it('should return unknown for missing headers', () => {
      const request = createMockRequest({});
      expect(getClientIP(request)).toBe('unknown');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
      });
      expect(getClientIP(request)).toBe('192.168.1.1');
    });
  });
});
