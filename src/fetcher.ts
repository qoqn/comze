import semver from 'semver';
import type { PackagistVersion, Stability } from './types';
import { STABILITY_ORDER } from './types';
import { getVersionStability, normalizeVersion } from './utils/version';
import { getCacheEntry, setCache, touchCache, type CacheEntry } from './cache';
import { checkPhpCompatibility } from './utils/php';

const PACKAGIST_API = 'https://repo.packagist.org/p2';

const CACHE_VERSION = 1;

export interface FetchResult {
  latestVersion: string;
  releaseTime: string;
  phpRequirement?: string;
  majorVersion?: string;
  deprecated?: boolean;
  replacement?: string;
  phpIncompatible?: boolean;
  skippedVersion?: string;
  require?: Record<string, string>;
}

interface PackagistResponse {
  packages?: Record<string, PackagistVersion[]>;
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
  projectPhp?: string,
): Promise<FetchResult | null> {
  const cacheKey = packageName.replace('/', '_');

  let cachedEntry: CacheEntry<PackagistResponse> | null = null;
  const headers: Record<string, string> = {};

  if (!noCache) {
    cachedEntry = await getCacheEntry<PackagistResponse>(cacheKey, CACHE_VERSION);
    if (cachedEntry?.lastModified) {
      headers['If-Modified-Since'] = cachedEntry.lastModified;
    }
  }

  let data: PackagistResponse;

  try {
    const url = `${PACKAGIST_API}/${packageName}.json`;
    const response = await fetch(url, { headers });

    if (response.status === 304 && cachedEntry) {
      await touchCache(cacheKey, CACHE_VERSION);
      data = cachedEntry.value;
    } else if (response.ok) {
      data = (await response.json()) as PackagistResponse;
      if (!noCache) {
        const lastModified = response.headers.get('Last-Modified') || undefined;
        await setCache(cacheKey, data, CACHE_VERSION, { lastModified });
      }
    } else {
      return null;
    }

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

    let phpIncompatible = false;
    let skippedVersion: string | undefined;

    if (projectPhp && selectedVersion.require?.php) {
      const phpCheck = checkPhpCompatibility(projectPhp, selectedVersion.require.php);
      if (!phpCheck.satisfied) {
        phpIncompatible = true;
        skippedVersion = selectedVersion.version;

        const versionsToCheck = preferStable
          ? eligibleVersions.filter((v) => getVersionStability(v.version) === 'stable')
          : eligibleVersions;

        const compatibleVersion = versionsToCheck.find((v) => {
          if (!v.require?.php) return true;
          return checkPhpCompatibility(projectPhp, v.require.php).satisfied;
        });

        if (compatibleVersion && compatibleVersion !== selectedVersion) {
          selectedVersion = compatibleVersion;
        }
      }
    }

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

    const deprecatedInfo: {
      deprecated?: boolean;
      replacement?: string;
    } = {};

    if (typeof selectedVersion.abandoned === 'string') {
      deprecatedInfo.deprecated = true;
      deprecatedInfo.replacement = selectedVersion.abandoned;
    } else if (selectedVersion.abandoned) {
      deprecatedInfo.deprecated = true;
    }

    const result: FetchResult = {
      latestVersion: selectedVersion.version,
      releaseTime: selectedVersion.time,
      phpRequirement: selectedVersion.require?.php ?? phpRequirement,
      majorVersion: majorDetected,
      deprecated: deprecatedInfo.deprecated,
      replacement: deprecatedInfo.replacement,
      phpIncompatible: phpIncompatible || undefined,
      skippedVersion,
      require: selectedVersion.require,
    };

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
  projectPhp?: string,
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
        projectPhp,
      );
      if (result) results.set(name, result);
    });
    await Promise.all(promises);
  }

  return results;
}
