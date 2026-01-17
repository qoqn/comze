import pc from 'picocolors';
import type { PackageInfo } from '../types';

/**
 * Colors the age based on how old the release is.
 */
function colorAge(age: string, ageMonths: number): string {
  if (ageMonths < 3) {
    return pc.green(age.padStart(6));
  } else if (ageMonths < 12) {
    return pc.yellow(age.padStart(6));
  } else {
    return pc.red(age.padStart(6));
  }
}

/**
 * Renders the package update table to stdout.
 */
export function renderTable(packages: PackageInfo[]): void {
  if (packages.length === 0) {
    console.log(pc.green('\n  ✓ All packages are up to date!\n'));
    return;
  }

  const nameWidth = Math.max(...packages.map((p) => p.name.length), 10);
  const oldWidth = Math.max(...packages.map((p) => p.currentVersion.length), 8);
  const newWidth = Math.max(...packages.map((p) => p.latestVersion.length), 8);

  console.log('');

  for (const pkg of packages) {
    const name = pc.bold(pkg.name.padEnd(nameWidth));
    const oldVer = pkg.currentVersion.padStart(oldWidth);
    const arrow = '→';
    const newVer = pkg.latestVersion.padEnd(newWidth);
    const age = colorAge(pkg.age, pkg.ageMonths);

    let diffLabel: string;
    let coloredNewVer: string;

    switch (pkg.diffType) {
      case 'major':
        diffLabel = pc.red('! major');
        coloredNewVer = pc.red(newVer);
        break;
      case 'minor':
        diffLabel = pc.cyan('~ minor');
        coloredNewVer = pc.cyan(newVer);
        break;
      case 'patch':
        diffLabel = pc.green('. patch');
        coloredNewVer = pc.green(newVer);
        break;
    }

    let extra = '';
    if (pkg.majorAvailable) {
      extra += pc.magenta(`  ${pkg.majorAvailable} available`);
    }
    if (pkg.phpRequirement) {
      extra += pc.gray(`  php ${pkg.phpRequirement}`);
    }

    console.log(`  ${name}  ${oldVer}  ${arrow}  ${coloredNewVer}  ${diffLabel}  ${age}${extra}`);
  }

  console.log('');
}

export function renderHeader(version: string): void {
  console.log('');
  console.log(pc.bold(`  comze v${version}`), pc.gray(' —  Check for updates for composer.json'));
  console.log('');
}

export function renderFooter(hasUpdates: boolean): void {
  if (hasUpdates) {
    console.log(pc.gray('  Run "comze -w" to write to composer.json'));
    console.log(pc.gray('  Run "comze -i" to write and install'));
    console.log('');
  }
}

export function formatPackageChoice(pkg: PackageInfo): string {
  const arrow = '→';
  let diffLabel: string;
  let coloredNewVer: string;

  switch (pkg.diffType) {
    case 'major':
      diffLabel = pc.red('! major');
      coloredNewVer = pc.red(pkg.latestVersion);
      break;
    case 'minor':
      diffLabel = pc.cyan('~ minor');
      coloredNewVer = pc.cyan(pkg.latestVersion);
      break;
    case 'patch':
      diffLabel = pc.green('. patch');
      coloredNewVer = pc.green(pkg.latestVersion);
      break;
  }

  const age = colorAge(pkg.age, pkg.ageMonths);
  let extra = '';
  if (pkg.majorAvailable) {
    extra += pc.magenta(` ${pkg.majorAvailable} available`);
  }
  if (pkg.phpRequirement) {
    extra += pc.gray(` php ${pkg.phpRequirement}`);
  }

  return `${pc.bold(pkg.name)} ${pkg.currentVersion} ${arrow} ${coloredNewVer} ${diffLabel} ${age}${extra}`;
}
