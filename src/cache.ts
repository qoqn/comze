import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';


function getCacheDir(): string {
  const home = os.homedir();
  const platform = os.platform();
  const overrideDir = process.env.COMZE_CACHE_DIR?.trim();

  if (overrideDir) {
    return overrideDir;
  }

  if (platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'),
      'comze',
      'Cache',
    );
  }

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Caches', 'comze');
  }

  return path.join(process.env.XDG_CACHE_HOME || path.join(home, '.cache'), 'comze');
}

export interface CacheEntry<T> {
  timestamp: number;
  value: T;
  lastModified?: string;
  etag?: string;
}

export async function getCacheEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const cacheDir = getCacheDir();
    const filePath = path.join(cacheDir, `${key}.json`);

    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as CacheEntry<T>;

    return data;
  } catch {
    return null;
  }
}



export async function setCache<T>(key: string, value: T, meta: { lastModified?: string; etag?: string } = {}): Promise<void> {
  try {
    const cacheDir = getCacheDir();
    await fs.mkdir(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `${key}.json`);
    const data: CacheEntry<T> = {
      timestamp: Date.now(),
      value,
      lastModified: meta.lastModified,
      etag: meta.etag,
    };

    await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
  } catch { }
}

export async function touchCache(key: string): Promise<void> {
  try {
    const entry = await getCacheEntry(key);
    if (entry) {
      await setCache(key, entry.value, { lastModified: entry.lastModified, etag: entry.etag });
    }
  } catch { }
}
