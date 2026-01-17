const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number; short: string }[] = [
    { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000, short: 'y' },
    { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000, short: 'mo' },
    { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000, short: 'w' },
    { unit: 'day', ms: 24 * 60 * 60 * 1000, short: 'd' },
    { unit: 'hour', ms: 60 * 60 * 1000, short: 'h' },
    { unit: 'minute', ms: 60 * 1000, short: 'm' },
];

/**
 * Converts an ISO date string to a short relative time format.
 * 
 * @param isoDate - ISO 8601 date string
 * @returns Short format like "2 d", "3 mo", "1 y"
 * 
 * @example
 * formatAge('2024-01-15T12:00:00Z') // "3 mo" (if current date is April 2024)
 */
export function formatAge(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    for (const { ms, short } of UNITS) {
        const value = Math.floor(diff / ms);
        if (value >= 1) {
            return `${value} ${short}`;
        }
    }

    return 'now';
}

/**
 * Calculates the number of months since a given ISO date.
 * 
 * @param isoDate - ISO 8601 date string
 * @returns Number of months (floored)
 */
export function getAgeMonths(isoDate: string): number {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;
    return Math.floor(diffMs / msPerMonth);
}
