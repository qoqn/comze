import { describe, test, expect } from 'bun:test';
import {
    renderTable,
    renderHeader,
    renderFooter,
    formatPackageChoice,
} from '../src/ui/render';
import type { PackageInfo } from '../src/types';

describe('formatPackageChoice', () => {
    test('formats major update correctly', () => {
        const pkg: PackageInfo = {
            name: 'vendor/package',
            currentVersion: '^1.0',
            latestVersion: '2.0.0',
            diffType: 'major',
            releaseTime: new Date().toISOString(),
            age: '1 d',
        };
        const result = formatPackageChoice(pkg);
        expect(result).toContain('vendor/package');
        expect(result).toContain('^1.0');
        expect(result).toContain('2.0.0');
        expect(result).toContain('1 d');
    });

    test('formats minor update correctly', () => {
        const pkg: PackageInfo = {
            name: 'vendor/package',
            currentVersion: '^1.0',
            latestVersion: '1.5.0',
            diffType: 'minor',
            releaseTime: new Date().toISOString(),
            age: '2 w',
        };
        const result = formatPackageChoice(pkg);
        expect(result).toContain('vendor/package');
        expect(result).toContain('1.5.0');
    });

    test('formats patch update correctly', () => {
        const pkg: PackageInfo = {
            name: 'vendor/package',
            currentVersion: '^1.0.0',
            latestVersion: '1.0.5',
            diffType: 'patch',
            releaseTime: new Date().toISOString(),
            age: '3 mo',
        };
        const result = formatPackageChoice(pkg);
        expect(result).toContain('1.0.5');
    });
});

describe('renderTable', () => {
    test('handles empty package list', () => {
        expect(() => renderTable([])).not.toThrow();
    });

    test('renders major update', () => {
        const packages: PackageInfo[] = [{
            name: 'vendor/package',
            currentVersion: '^1.0',
            latestVersion: '2.0.0',
            diffType: 'major',
            releaseTime: new Date().toISOString(),
            age: '1 d',
        }];
        expect(() => renderTable(packages)).not.toThrow();
    });

    test('renders minor update', () => {
        const packages: PackageInfo[] = [{
            name: 'vendor/package',
            currentVersion: '^1.0',
            latestVersion: '1.5.0',
            diffType: 'minor',
            releaseTime: new Date().toISOString(),
            age: '2 w',
        }];
        expect(() => renderTable(packages)).not.toThrow();
    });

    test('renders patch update', () => {
        const packages: PackageInfo[] = [{
            name: 'vendor/package',
            currentVersion: '^1.0.0',
            latestVersion: '1.0.5',
            diffType: 'patch',
            releaseTime: new Date().toISOString(),
            age: '3 mo',
        }];
        expect(() => renderTable(packages)).not.toThrow();
    });
});

describe('renderHeader', () => {
    test('renders without error', () => {
        expect(() => renderHeader('0.1.0')).not.toThrow();
    });
});

describe('renderFooter', () => {
    test('renders with updates', () => {
        expect(() => renderFooter(true)).not.toThrow();
    });

    test('renders without updates', () => {
        expect(() => renderFooter(false)).not.toThrow();
    });
});
