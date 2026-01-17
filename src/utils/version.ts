import semver from 'semver';
import type { Stability } from '../types';
import { STABILITY_ORDER } from '../types';

export type ConstraintType = 'exact' | 'range' | 'hyphen' | 'wildcard' | 'tilde' | 'caret' | 'dev';

export interface ParsedConstraint {
  type: ConstraintType;
  prefix: string;
  baseVersion: string;
  original: string;
  isDev: boolean;
}

/**
 * Parses a Composer version constraint into its components.
 * Handles all constraint types: exact, range, hyphen, wildcard, tilde, caret, and dev.
 *
 * @example
 * parseConstraint('^1.2.3')  // { type: 'caret', prefix: '^', baseVersion: '1.2.3', ... }
 * parseConstraint('dev-main') // { type: 'dev', prefix: 'dev-', baseVersion: 'main', ... }
 */
export function parseConstraint(constraint: string): ParsedConstraint {
  const original = constraint.trim();

  if (original.includes(' as ')) {
    const parts = original.split(' as ').map((s) => s.trim());
    return { type: 'dev', prefix: '', baseVersion: parts[1] ?? '', original, isDev: true };
  }

  if (original.startsWith('dev-')) {
    return { type: 'dev', prefix: 'dev-', baseVersion: original.slice(4), original, isDev: true };
  }

  if (original.endsWith('-dev') || original.endsWith('.x-dev')) {
    return { type: 'dev', prefix: '', baseVersion: original, original, isDev: true };
  }

  if (original.startsWith('^')) {
    const version = original.slice(1);
    return {
      type: 'caret',
      prefix: '^',
      baseVersion: normalizeVersionString(version),
      original,
      isDev: hasDevSuffix(version),
    };
  }

  if (original.startsWith('~')) {
    const version = original.slice(1);
    return {
      type: 'tilde',
      prefix: '~',
      baseVersion: normalizeVersionString(version),
      original,
      isDev: hasDevSuffix(version),
    };
  }

  if (original.includes('*')) {
    const basePart = (original.split('*')[0] ?? '').replace(/\.$/, '');
    return { type: 'wildcard', prefix: '', baseVersion: basePart, original, isDev: false };
  }

  if (original.includes(' - ')) {
    const startVersion = (original.split(' - ')[0] ?? '').trim();
    return {
      type: 'hyphen',
      prefix: '',
      baseVersion: normalizeVersionString(startVersion),
      original,
      isDev: false,
    };
  }

  const rangeMatch = original.match(/^([><!=]+)/);
  if (rangeMatch) {
    const versionMatch = original.match(/([><!=]+)\s*(\d+(?:\.\d+)*(?:-[\w.]+)?)/);
    const version = versionMatch?.[2] ?? original.replace(/[><!=]+/g, '');
    const prefix = rangeMatch[1] ?? '>=';
    return {
      type: 'range',
      prefix,
      baseVersion: normalizeVersionString(version),
      original,
      isDev: hasDevSuffix(version),
    };
  }

  return {
    type: 'exact',
    prefix: '',
    baseVersion: normalizeVersionString(original),
    original,
    isDev: hasDevSuffix(original),
  };
}

function hasDevSuffix(version: string): boolean {
  const lower = version.toLowerCase();
  return (
    lower.includes('-dev') ||
    lower.includes('alpha') ||
    lower.includes('beta') ||
    lower.includes('-rc') ||
    lower.includes('@dev') ||
    lower.includes('@alpha') ||
    lower.includes('@beta') ||
    lower.includes('@rc')
  );
}

/**
 * Normalizes a version string by removing 'v' prefix and stability flags.
 */
export function normalizeVersionString(version: string): string {
  return version
    .trim()
    .replace(/^v/i, '')
    .replace(/@(dev|alpha|beta|rc|stable)$/i, '');
}

/**
 * Checks if a version represents a development or unstable release.
 */
export function isDevVersion(version: string): boolean {
  const lower = version.toLowerCase();
  return (
    lower.startsWith('dev-') ||
    lower.endsWith('-dev') ||
    lower.endsWith('.x-dev') ||
    lower.includes(' as ') ||
    hasDevSuffix(version)
  );
}

/**
 * Extracts the stability level from a version string.
 * @returns The stability level (dev, alpha, beta, RC, or stable)
 */
export function getVersionStability(version: string): Stability {
  const lower = version.toLowerCase();

  if (lower.startsWith('dev-') || lower.endsWith('-dev') || lower.includes('@dev')) {
    return 'dev';
  }
  if (lower.includes('alpha') || lower.includes('@alpha')) {
    return 'alpha';
  }
  if (lower.includes('beta') || lower.includes('@beta')) {
    return 'beta';
  }
  if (lower.includes('-rc') || lower.includes('@rc')) {
    return 'RC';
  }
  return 'stable';
}

/**
 * Checks if a version meets the minimum stability requirement.
 *
 * @param version - The version string to check
 * @param minStability - Minimum required stability level
 * @param preferStable - If true, prefer stable versions when available
 */
export function meetsStabilityRequirement(
  version: string,
  minStability: Stability = 'stable',
  preferStable: boolean = true,
): boolean {
  const versionStability = getVersionStability(version);
  const minLevel = STABILITY_ORDER[minStability];
  const versionLevel = STABILITY_ORDER[versionStability];

  if (preferStable && versionLevel < STABILITY_ORDER.stable) {
    return versionLevel >= minLevel;
  }

  return versionLevel >= minLevel;
}

/**
 * Normalizes a constraint to a clean semver version for comparison.
 * Returns null for dev versions that cannot be compared.
 */
export function normalizeVersion(version: string): string | null {
  const parsed = parseConstraint(version);

  if (parsed.type === 'dev' && !version.includes(' as ')) {
    return null;
  }

  const coerced = semver.coerce(parsed.baseVersion);
  return coerced ? coerced.version : null;
}

/**
 * Determines the type of version change between two versions.
 *
 * @returns 'major', 'minor', 'patch', or null if no update needed
 */
export function getDiffType(
  currentVersion: string,
  latestVersion: string,
): 'major' | 'minor' | 'patch' | null {
  const current = normalizeVersion(currentVersion);
  const latest = normalizeVersion(latestVersion);

  if (!current || !latest) return null;

  try {
    if (semver.major(latest) > semver.major(current)) return 'major';
    if (semver.minor(latest) > semver.minor(current)) return 'minor';
    if (semver.patch(latest) > semver.patch(current)) return 'patch';
  } catch {
    return null;
  }

  return null;
}

/**
 * Formats a new version with the same constraint style as the original.
 *
 * @example
 * formatNewVersion('^1.0', '1.5.0')  // '^1.5.0'
 * formatNewVersion('~1.2', '1.3.0')  // '~1.3.0'
 */
export function formatNewVersion(originalConstraint: string, newVersion: string): string {
  const parsed = parseConstraint(originalConstraint);
  const cleaned = newVersion.replace(/^v/i, '');

  if (parsed.type === 'dev') {
    return originalConstraint;
  }

  if (parsed.type === 'wildcard') {
    const coerced = semver.coerce(cleaned);
    if (coerced) {
      const major = semver.major(coerced.version);
      const minor = semver.minor(coerced.version);
      if (originalConstraint.match(/^\d+\.\*$/)) {
        return `${major}.*`;
      }
      return `${major}.${minor}.*`;
    }
    return originalConstraint;
  }

  if (parsed.type === 'hyphen') {
    const startPart = (originalConstraint.split(' - ')[0] ?? '').trim();
    return `${startPart} - ${cleaned}`;
  }

  if (parsed.type === 'range') {
    return `^${cleaned}`;
  }

  return `${parsed.prefix}${cleaned}`;
}
