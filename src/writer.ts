import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import detectIndent from 'detect-indent';
import type { PackageInfo, ComposerJson } from './types';
import { formatNewVersion } from './utils/version';

/**
 * Reads and parses composer.json, detecting indentation style.
 */
export async function readComposerJson(path: string): Promise<{
    content: ComposerJson;
    raw: string;
    indent: string;
} | null> {
    if (!existsSync(path)) return null;

    try {
        const raw = await readFile(path, 'utf-8');
        const indent = detectIndent(raw).indent || '    ';
        const content = JSON.parse(raw) as ComposerJson;
        return { content, raw, indent };
    } catch {
        return null;
    }
}

/**
 * Writes updates to composer.json while preserving formatting.
 */
export async function writeComposerJson(
    path: string,
    updates: PackageInfo[],
    dryRun: boolean = false
): Promise<boolean> {
    const result = await readComposerJson(path);
    if (!result) return false;

    const { content, indent } = result;

    for (const pkg of updates) {
        const requireVersion = content.require?.[pkg.name];
        if (requireVersion !== undefined) {
            content.require![pkg.name] = formatNewVersion(requireVersion, pkg.latestVersion);
        }
        const devVersion = content['require-dev']?.[pkg.name];
        if (devVersion !== undefined) {
            content['require-dev']![pkg.name] = formatNewVersion(devVersion, pkg.latestVersion);
        }
    }

    if (dryRun) {
        console.log('\n  [dry-run] Would write the following changes:\n');
        for (const pkg of updates) {
            console.log(`    ${pkg.name}: ${pkg.currentVersion} → ${pkg.latestVersion}`);
        }
        console.log('');
        return true;
    }

    try {
        const newContent = JSON.stringify(content, null, indent) + '\n';
        await writeFile(path, newContent, 'utf-8');
        return true;
    } catch {
        return false;
    }
}

/**
 * Runs `composer update` in the specified directory.
 * Uses child_process.spawn for compatibility with Node.js, Bun, and pnpm.
 */
export async function runComposerUpdate(cwd: string): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn('composer', ['update'], {
            cwd,
            stdio: 'inherit',
            shell: true,
        });

        proc.on('close', (code) => {
            resolve(code === 0);
        });

        proc.on('error', () => {
            resolve(false);
        });
    });
}
