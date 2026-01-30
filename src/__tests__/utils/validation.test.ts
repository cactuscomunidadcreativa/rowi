/**
 * Tests for data validation utilities
 * These tests help establish validation patterns for the application
 */

describe('Data Validation Patterns', () => {
  describe('Email validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user @domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('UUID validation', () => {
    const isValidUUID = (id: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    it('should validate correct UUID formats', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('invalid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
    });
  });

  describe('EQ Score validation', () => {
    const isValidEQScore = (score: number): boolean => {
      return typeof score === 'number' && score >= 0 && score <= 100;
    };

    it('should validate scores within range', () => {
      expect(isValidEQScore(0)).toBe(true);
      expect(isValidEQScore(50)).toBe(true);
      expect(isValidEQScore(100)).toBe(true);
      expect(isValidEQScore(73.5)).toBe(true);
    });

    it('should reject scores outside range', () => {
      expect(isValidEQScore(-1)).toBe(false);
      expect(isValidEQScore(101)).toBe(false);
      expect(isValidEQScore(150)).toBe(false);
    });
  });

  describe('Required fields validation', () => {
    const validateRequiredFields = <T extends Record<string, any>>(
      data: T,
      requiredFields: (keyof T)[]
    ): { valid: boolean; missing: string[] } => {
      const missing: string[] = [];

      for (const field of requiredFields) {
        const value = data[field];
        if (value === undefined || value === null || value === '') {
          missing.push(field as string);
        }
      }

      return {
        valid: missing.length === 0,
        missing,
      };
    };

    it('should pass when all required fields are present', () => {
      const data = { name: 'John', email: 'john@example.com', age: 30 };
      const result = validateRequiredFields(data, ['name', 'email']);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should fail when required fields are missing', () => {
      const data = { name: 'John', email: '' };
      const result = validateRequiredFields(data, ['name', 'email', 'age'] as any);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('email');
      expect(result.missing).toContain('age');
    });

    it('should handle null values as missing', () => {
      const data = { name: null, email: 'test@example.com' };
      const result = validateRequiredFields(data, ['name', 'email']);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('name');
    });
  });

  describe('Slug validation', () => {
    const isValidSlug = (slug: string): boolean => {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      return slugRegex.test(slug);
    };

    it('should validate correct slug formats', () => {
      expect(isValidSlug('my-community')).toBe(true);
      expect(isValidSlug('test123')).toBe(true);
      expect(isValidSlug('my-super-hub-2024')).toBe(true);
    });

    it('should reject invalid slug formats', () => {
      expect(isValidSlug('My Community')).toBe(false);
      expect(isValidSlug('test_123')).toBe(false);
      expect(isValidSlug('TEST')).toBe(false);
      expect(isValidSlug('-invalid')).toBe(false);
      expect(isValidSlug('invalid-')).toBe(false);
      expect(isValidSlug('')).toBe(false);
    });
  });

  describe('Date validation', () => {
    const isValidDate = (dateString: string): boolean => {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    };

    it('should validate correct date formats', () => {
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('2024-01-15T10:30:00Z')).toBe(true);
      expect(isValidDate('January 15, 2024')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-13-45')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('Pagination validation', () => {
    const validatePagination = (page: any, limit: any): { page: number; limit: number } => {
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

      return { page: validPage, limit: validLimit };
    };

    it('should use defaults for missing values', () => {
      expect(validatePagination(undefined, undefined)).toEqual({ page: 1, limit: 20 });
    });

    it('should parse string values', () => {
      expect(validatePagination('2', '50')).toEqual({ page: 2, limit: 50 });
    });

    it('should enforce minimum page of 1', () => {
      expect(validatePagination(0, 20)).toEqual({ page: 1, limit: 20 });
      expect(validatePagination(-5, 20)).toEqual({ page: 1, limit: 20 });
    });

    it('should enforce maximum limit of 100', () => {
      expect(validatePagination(1, 200)).toEqual({ page: 1, limit: 100 });
      expect(validatePagination(1, 500)).toEqual({ page: 1, limit: 100 });
    });

    it('should enforce minimum limit and handle edge cases', () => {
      // parseInt(0) is 0 which is falsy, so defaults to 20
      expect(validatePagination(1, 0)).toEqual({ page: 1, limit: 20 });
      // Negative values are clamped to 1
      expect(validatePagination(1, -10)).toEqual({ page: 1, limit: 1 });
    });
  });
});
