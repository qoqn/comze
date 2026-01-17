import prompts from 'prompts';
import type { PackageInfo } from './types';
import { formatPackageChoice } from './ui/render';

/**
 * Presents an interactive multiselect for choosing which packages to update.
 * Non-major updates are pre-selected by default.
 */
export async function selectPackages(packages: PackageInfo[]): Promise<PackageInfo[]> {
  if (packages.length === 0) return [];

  const choices = packages.map((pkg) => ({
    title: formatPackageChoice(pkg),
    value: pkg.name,
    selected: pkg.diffType !== 'major',
  }));

  const response = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: 'Select packages to update',
    choices,
    hint: '- Space to select. Return to submit',
    instructions: false,
  });

  if (!response.selected) return [];

  const selectedNames = new Set(response.selected as string[]);
  return packages.filter((pkg) => selectedNames.has(pkg.name));
}
