import type { PackagistVersion, Stability } from './types';
import { STABILITY_ORDER } from './types';
import { getVersionStability } from './utils/version';

const PACKAGIST_API = 'https://repo.packagist.org/p2';

export interface FetchResult {
    latestVersion: string;
    releaseTime: string;
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
    preferStable: boolean = true
): Promise<FetchResult | null> {
    try {
        const url = `${PACKAGIST_API}/${packageName}.json`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const data = await response.json() as { packages?: Record<string, PackagistVersion[]> };
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

        if (preferStable) {
            const stableVersions = eligibleVersions.filter(
                (v) => getVersionStability(v.version) === 'stable'
            );
            if (stableVersions.length > 0) {
                const latest = stableVersions[0];
                if (!latest) return null;
                return { latestVersion: latest.version, releaseTime: latest.time };
            }
        }

        const latest = eligibleVersions[0];
        if (!latest) return null;
        return { latestVersion: latest.version, releaseTime: latest.time };
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
    preferStable: boolean = true
): Promise<Map<string, FetchResult>> {
    const results = new Map<string, FetchResult>();
    const entries = Object.entries(packages);
    const CONCURRENCY = 5;

    for (let i = 0; i < entries.length; i += CONCURRENCY) {
        const batch = entries.slice(i, i + CONCURRENCY);
        const promises = batch.map(async ([name]) => {
            const result = await fetchPackage(name, minStability, preferStable);
            if (result) results.set(name, result);
        });
        await Promise.all(promises);
    }

    return results;
}
