import {
  emailSchema,
  uuidSchema,
  slugSchema,
  eqScoreSchema,
  paginationSchema,
  safeStringSchema,
  sanitizeString,
  isSafeId,
} from '@/lib/security/validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@domain.co').success).toBe(true);
      expect(emailSchema.safeParse('user+tag@example.org').success).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(emailSchema.safeParse('invalid').success).toBe(false);
      expect(emailSchema.safeParse('invalid@').success).toBe(false);
      expect(emailSchema.safeParse('@domain.com').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      expect(
        uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000').success
      ).toBe(true);
      expect(
        uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success
      ).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(uuidSchema.safeParse('invalid').success).toBe(false);
      expect(uuidSchema.safeParse('123').success).toBe(false);
      expect(uuidSchema.safeParse('').success).toBe(false);
    });
  });

  describe('slugSchema', () => {
    it('should accept valid slugs', () => {
      expect(slugSchema.safeParse('my-community').success).toBe(true);
      expect(slugSchema.safeParse('test123').success).toBe(true);
      expect(slugSchema.safeParse('my-super-hub-2024').success).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(slugSchema.safeParse('My Community').success).toBe(false);
      expect(slugSchema.safeParse('test_123').success).toBe(false);
      expect(slugSchema.safeParse('TEST').success).toBe(false);
      expect(slugSchema.safeParse('-invalid').success).toBe(false);
      expect(slugSchema.safeParse('a').success).toBe(false); // too short
    });
  });

  describe('eqScoreSchema', () => {
    it('should accept scores within range', () => {
      expect(eqScoreSchema.safeParse(0).success).toBe(true);
      expect(eqScoreSchema.safeParse(50).success).toBe(true);
      expect(eqScoreSchema.safeParse(100).success).toBe(true);
      expect(eqScoreSchema.safeParse(73.5).success).toBe(true);
    });

    it('should reject scores outside range', () => {
      expect(eqScoreSchema.safeParse(-1).success).toBe(false);
      expect(eqScoreSchema.safeParse(101).success).toBe(false);
      expect(eqScoreSchema.safeParse(150).success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should parse valid pagination', () => {
      const result = paginationSchema.safeParse({ page: '2', limit: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it('should use defaults for missing values', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should enforce maximum limit', () => {
      const result = paginationSchema.safeParse({ limit: '200' });
      expect(result.success).toBe(false);
    });
  });

  describe('safeStringSchema', () => {
    it('should accept normal strings', () => {
      expect(safeStringSchema.safeParse('Hello world').success).toBe(true);
      expect(safeStringSchema.safeParse('Test 123!').success).toBe(true);
    });

    it('should reject potential XSS', () => {
      expect(safeStringSchema.safeParse('<script>alert(1)</script>').success).toBe(
        false
      );
      expect(safeStringSchema.safeParse('onclick=alert(1)').success).toBe(false);
      expect(safeStringSchema.safeParse('javascript:alert(1)').success).toBe(false);
    });
  });
});

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    it('should escape HTML characters', () => {
      expect(sanitizeString('<script>')).toBe('&lt;script&gt;');
      expect(sanitizeString('"test"')).toBe('&quot;test&quot;');
      expect(sanitizeString("'test'")).toBe('&#x27;test&#x27;');
    });

    it('should escape forward slashes', () => {
      expect(sanitizeString('</script>')).toBe('&lt;&#x2F;script&gt;');
    });
  });

  describe('isSafeId', () => {
    it('should accept safe IDs', () => {
      expect(isSafeId('user-123')).toBe(true);
      expect(isSafeId('user_123')).toBe(true);
      expect(isSafeId('abc123')).toBe(true);
      expect(isSafeId('ABC-xyz_123')).toBe(true);
    });

    it('should reject unsafe IDs', () => {
      expect(isSafeId('user 123')).toBe(false);
      expect(isSafeId('user@123')).toBe(false);
      expect(isSafeId('user.123')).toBe(false);
      expect(isSafeId('../etc/passwd')).toBe(false);
    });
  });
});
