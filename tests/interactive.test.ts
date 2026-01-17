import { describe, test, expect } from 'bun:test';
import { selectPackages } from '../src/interactive';

describe('selectPackages', () => {
  test('returns empty array for empty input', async () => {
    const result = await selectPackages([]);
    expect(result).toEqual([]);
  });
});
