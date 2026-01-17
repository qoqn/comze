import { describe, test, expect } from 'bun:test';
import os from 'node:os';
import path from 'node:path';
import { getCache, setCache } from '../src/cache';

const TEST_CACHE_KEY = 'test_key';
const TEST_CACHE_DIR = path.join(os.tmpdir(), 'comze-test-cache');

process.env.COMZE_CACHE_DIR = TEST_CACHE_DIR;

describe('Cache', () => {
  test('can write and read cache', async () => {
    const data = { foo: 'bar' };
    await setCache(TEST_CACHE_KEY, data);

    const cached = await getCache<{ foo: string }>(TEST_CACHE_KEY);
    expect(cached).toEqual(data);
  });

  test('returns null for missing key', async () => {
    const cached = await getCache('non_existent_key');
    expect(cached).toBeNull();
  });
});
