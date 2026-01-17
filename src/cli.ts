import cac from 'cac';
import { run } from './index';
import type { CLIOptions } from './types';

const cli = cac('comze');

cli
    .option('-w, --write', 'Write changes to composer.json', { default: false })
    .option('-i, --install', 'Write changes and run composer update', { default: false })
    .option('-I, --interactive', 'Select updates manually', { default: false })
    .option('--major', 'Include major updates', { default: false })
    .option('--minor', 'Include minor updates', { default: true })
    .option('--patch', 'Include patch updates', { default: true })
    .option('--exclude <packages>', 'Exclude packages (comma-separated)', { default: '' })
    .option('--dry-run', 'Run without making changes', { default: false });

cli.help();
cli.version('0.1.0');

cli.command('', 'Check for updates in composer.json').action(async (cliOptions) => {
    const options: CLIOptions = {
        write: cliOptions.write || cliOptions.install,
        install: cliOptions.install,
        interactive: cliOptions.interactive,
        major: cliOptions.major,
        minor: cliOptions.minor,
        patch: cliOptions.patch,
        exclude: cliOptions.exclude ? cliOptions.exclude.split(',').map((s: string) => s.trim()) : [],
        dryRun: cliOptions.dryRun,
    };

    await run(options);
});

cli.parse();
