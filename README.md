# comze

A [taze](https://github.com/antfu/taze)-like CLI for updating `composer.json` dependencies.

## Features

- 🔍 Check for outdated dependencies in `composer.json`
- 📊 Colored output: Major (red), Minor (cyan), Patch (green)
- ⏱️ Version age display (e.g., "2 d", "3 mo")
- 🎯 Respects `minimum-stability` and `prefer-stable`
- 🚫 Major updates hidden by default
- ✍️ Interactive selection mode
- ⚠️ Detects deprecated packages

## Installation

```bash
# Global install
npm install -g comze

# Or use directly with npx/bunx/pnpx
npx comze
bunx comze
pnpx comze
```

## Usage

```bash
# Check for updates
comze

# Include major updates
comze --major

# Write changes to composer.json
comze -w

# Write + run composer update
comze -i

# Interactive mode
comze -I

# Dry run
comze --dry-run

# Exclude packages
comze --exclude vendor/package

# Exclude multiple packages
comze --exclude vendor/package-a,vendor/package-b
```

## Options

| Flag                | Description                             |
| ------------------- | --------------------------------------- |
| `-w, --write`       | Write changes to `composer.json`        |
| `-i, --install`     | Write changes and run `composer update` |
| `-I, --interactive` | Select updates manually                 |
| `--major`           | Include major updates (default: false)  |
| `--minor`           | Include minor updates (default: true)   |
| `--patch`           | Include patch updates (default: true)   |
| `--exclude <pkgs>`  | Exclude packages (comma-separated, merged with `extra.comze.exclude`) |
| `--dry-run`         | Preview changes without writing         |

## Persistent Excludes

For packages that should always be ignored, store them in `composer.json` under `extra.comze.exclude`:

```json
{
  "extra": {
    "comze": {
      "exclude": [
        "vendor/package-a",
        "vendor/package-b"
      ]
    }
  }
}
```

`comze` merges this list with `--exclude`, so the flag remains useful for one-off runs while the file keeps repository-wide defaults.

## Composer Stability

comze reads `minimum-stability` and `prefer-stable` from your `composer.json`:

```json
{
  "minimum-stability": "dev",
  "prefer-stable": true
}
```

## Version Constraints

All Composer version constraints are supported:

| Type       | Example               |
| ---------- | --------------------- |
| Exact      | `1.0.2`               |
| Caret      | `^1.2.3`              |
| Tilde      | `~1.2`                |
| Wildcard   | `1.0.*`               |
| Range      | `>=1.0 <2.0`          |
| Hyphenated | `1.0 - 2.0`           |
| Dev        | `dev-main`, `1.x-dev` |

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Run tests
bun test

# Build for publishing
bun run build
```

## License

MIT
