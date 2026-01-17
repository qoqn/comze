import semver from 'semver';
import type { PackagistVersion, Stability } from './types';
import { STABILITY_ORDER } from './types';
import { getVersionStability, normalizeVersion } from './utils/version';
import { getCache, setCache } from './cache';

const PACKAGIST_API = 'https://repo.packagist.org/p2';
const PACKAGIST_PACKAGE_API = 'https://packagist.org/packages';

export interface FetchResult {
  latestVersion: string;
  releaseTime: string;
  phpRequirement?: string;
  majorVersion?: string;
  deprecated?: boolean;
  replacement?: string;
}

async function fetchDeprecatedInfo(
  packageName: string,
  noCache: boolean = false,
): Promise<{ deprecated?: boolean; replacement?: string }> {
  const cacheKey = `${packageName.replace('/', '_')}_deprecated`;

  if (!noCache) {
    const cached = await getCache<{ deprecated?: boolean; replacement?: string }>(cacheKey);
    if (cached) return cached;
  }

  try {
    const url = `${PACKAGIST_PACKAGE_API}/${packageName}.json`;
    const response = await fetch(url);
    if (!response.ok) return {};

    const data = (await response.json()) as {
      package?: { abandoned?: boolean | string };
    };

    const abandoned = data.package?.abandoned;
    if (!abandoned) {
      const result = {};
      if (!noCache) await setCache(cacheKey, result);
      return result;
    }

    if (typeof abandoned === 'string') {
      const result = { deprecated: true, replacement: abandoned };
      if (!noCache) await setCache(cacheKey, result);
      return result;
    }

    const result = { deprecated: true };
    if (!noCache) await setCache(cacheKey, result);
    return result;
  } catch {
    return {};
  }
}

/**
 * Fetches package metadata from the Packagist V2 API.
 *
 * @param packageName - Package name in "vendor/package" format
 * @param minStability - Minimum stability level to consider (default: 'stable')
 * @param preferStable - Prefer stable versions when available (default: true)
 */
export async function fetchPackage(
  packageName: string,
  minStability: Stability = 'stable',
  preferStable: boolean = true,
  currentVersion?: string,
  allowMajor: boolean = true,
  noCache: boolean = false,
): Promise<FetchResult | null> {
  const cacheKey = packageName.replace('/', '_');

  if (!noCache) {
    const cached = await getCache<FetchResult>(cacheKey);
    if (cached) return cached;
  }

  try {
    const url = `${PACKAGIST_API}/${packageName}.json`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      packages?: Record<string, PackagistVersion[]>;
    };
    const versions: PackagistVersion[] = data.packages?.[packageName] ?? [];

    if (versions.length === 0) return null;

    const minLevel = STABILITY_ORDER[minStability];

    const eligibleVersions = versions.filter((v) => {
      const stability = getVersionStability(v.version);
      const level = STABILITY_ORDER[stability];
      return level >= minLevel;
    });

    if (eligibleVersions.length === 0) {
      const first = versions[0];
      if (!first) return null;
      return { latestVersion: first.version, releaseTime: first.time };
    }

    let selectedVersion: PackagistVersion | null = null;

    if (preferStable) {
      const stableVersions = eligibleVersions.filter(
        (v) => getVersionStability(v.version) === 'stable',
      );
      if (stableVersions.length > 0) {
        selectedVersion = stableVersions[0] ?? null;
      }
    }

    if (!selectedVersion) {
      selectedVersion = eligibleVersions[0] ?? null;
    }

    if (!selectedVersion) return null;

    const phpRequirement = selectedVersion.require?.php;
    let majorDetected: string | undefined;

    if (currentVersion) {
      const currentNorm = normalizeVersion(currentVersion);
      const selectedNorm = normalizeVersion(selectedVersion.version);

      if (currentNorm && selectedNorm) {
        const currentMajor = semver.major(currentNorm);
        const selectedMajor = semver.major(selectedNorm);

        if (selectedMajor > currentMajor) {
          majorDetected = selectedVersion.version;

          if (!allowMajor) {
            const versionsToCheck = preferStable
              ? eligibleVersions.filter((v) => getVersionStability(v.version) === 'stable')
              : eligibleVersions;

            const sameMajorVersion = versionsToCheck.find((v) => {
              const norm = normalizeVersion(v.version);
              return norm && semver.major(norm) === currentMajor;
            });

            if (sameMajorVersion) {
              selectedVersion = sameMajorVersion;
            }
          }
        }
      }
    }

    const deprecatedInfo = await fetchDeprecatedInfo(packageName, noCache);

    const result: FetchResult = {
      latestVersion: selectedVersion.version,
      releaseTime: selectedVersion.time,
      phpRequirement: selectedVersion.require?.php ?? phpRequirement,
      majorVersion: majorDetected,
      deprecated: deprecatedInfo.deprecated,
      replacement: deprecatedInfo.replacement,
    };

    if (!noCache) {
      await setCache(cacheKey, result);
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Fetches updates for all packages in parallel with concurrency control.
 *
 * @param packages - Map of package names to current versions
 * @param minStability - Minimum stability level
 * @param preferStable - Prefer stable versions
 */
export async function fetchAllPackages(
  packages: Record<string, string>,
  minStability: Stability = 'stable',
  preferStable: boolean = true,
  allowMajor: boolean = true,
  noCache: boolean = false,
): Promise<Map<string, FetchResult>> {
  const results = new Map<string, FetchResult>();
  const entries = Object.entries(packages);
  const CONCURRENCY = 5;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    const promises = batch.map(async ([name, version]) => {
      const result = await fetchPackage(
        name,
        minStability,
        preferStable,
        version,
        allowMajor,
        noCache,
      );
      if (result) results.set(name, result);
    });
    await Promise.all(promises);
  }

  return results;
}
