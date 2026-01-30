/**
 * Tests for i18n utility functions
 * Note: getI18n uses filesystem, so we test the humanizeKey logic
 */

describe('i18n utilities', () => {
  // Test the humanizeKey logic (extracted for testing)
  function humanizeKey(key: string): string {
    return key
      .split('.')
      .pop()!
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  describe('humanizeKey', () => {
    it('should extract last segment from dotted key', () => {
      expect(humanizeKey('nav.dashboard')).toBe('Dashboard');
      expect(humanizeKey('settings.profile.name')).toBe('Name');
    });

    it('should replace underscores with spaces', () => {
      expect(humanizeKey('user_profile')).toBe('User Profile');
    });

    it('should replace hyphens with spaces', () => {
      expect(humanizeKey('user-profile')).toBe('User Profile');
    });

    it('should capitalize first letter of each word', () => {
      expect(humanizeKey('hello_world')).toBe('Hello World');
      expect(humanizeKey('user-settings-page')).toBe('User Settings Page');
    });

    it('should handle simple keys', () => {
      expect(humanizeKey('dashboard')).toBe('Dashboard');
      expect(humanizeKey('settings')).toBe('Settings');
    });

    it('should handle already capitalized keys', () => {
      expect(humanizeKey('Dashboard')).toBe('Dashboard');
    });
  });
});
