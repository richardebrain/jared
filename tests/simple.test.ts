import { describe, it, expect } from '@jest/globals';

describe('Simple Test Suite', () => {
  it('should run basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
  });

  it('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world');
    expect('test'.length).toBe(4);
  });

  it('should handle boolean operations', () => {
    expect(true && true).toBe(true);
    expect(true && false).toBe(false);
    expect(!false).toBe(true);
  });
}); 