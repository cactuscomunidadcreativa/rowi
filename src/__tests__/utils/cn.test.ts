import { cn } from '@/utils/cn';

describe('cn utility function', () => {
  it('should merge simple class names', () => {
    expect(cn('p-2', 'bg-red-500')).toBe('p-2 bg-red-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('p-2', isActive && 'bg-green-500')).toBe('p-2 bg-green-500');
  });

  it('should handle false conditionals', () => {
    const isActive = false;
    expect(cn('p-2', isActive && 'bg-green-500')).toBe('p-2');
  });

  it('should merge conflicting Tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle undefined and null values', () => {
    expect(cn('p-2', undefined, null, 'bg-red-500')).toBe('p-2 bg-red-500');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['p-2', 'bg-red-500'])).toBe('p-2 bg-red-500');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ 'p-2': true, 'bg-red-500': false, 'text-white': true })).toBe('p-2 text-white');
  });

  it('should return empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle complex responsive classes', () => {
    expect(cn('sm:p-2', 'md:p-4', 'lg:p-6')).toBe('sm:p-2 md:p-4 lg:p-6');
  });
});
