import { describe, test, expect, afterAll } from 'bun:test';
import os from 'node:os';
import path from 'node:path';
import { getCacheEntry, setCache } from '../src/cache';

const TEST_CACHE_KEY = 'test_key';
const TEST_CACHE_DIR = path.join(os.tmpdir(), `comze-test-cache-${Math.random().toString(36).slice(2)}`);

process.env.COMZE_CACHE_DIR = TEST_CACHE_DIR;

describe('Cache', () => {
  test('can write and read cache', async () => {
    const data = { foo: 'bar' };
    await setCache(TEST_CACHE_KEY, data);

    const cached = await getCacheEntry<{ foo: string }>(TEST_CACHE_KEY);
    expect(cached).not.toBeNull();
    expect(cached?.value).toEqual(data);
  });

  test('returns null for missing key', async () => {
    const cached = await getCacheEntry('non_existent_key');
    expect(cached).toBeNull();
  });

  afterAll(async () => {
    try {
      await import('node:fs/promises').then(fs => fs.rm(TEST_CACHE_DIR, { recursive: true, force: true }));
    } catch { }
  });
});
