import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const CACHE_TTL = 30 * 60 * 1000;

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

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cacheDir = getCacheDir();
    const filePath = path.join(cacheDir, `${key}.json`);

    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (Date.now() - data.timestamp > CACHE_TTL) {
      fs.unlink(filePath).catch(() => {});
      return null;
    }

    return data.value as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    const cacheDir = getCacheDir();
    await fs.mkdir(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `${key}.json`);
    const data = {
      timestamp: Date.now(),
      value,
    };

    await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
  } catch {}
}
