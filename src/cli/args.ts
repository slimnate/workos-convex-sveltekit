export type CliOptions = {
  dest: string;
  force: boolean;
  yes: boolean;
  dryRun: boolean;
  backup: boolean;
  verbose: boolean;
  help: boolean;
  version: boolean;
};

export function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dest: process.cwd(),
    force: false,
    yes: false,
    dryRun: false,
    backup: false,
    verbose: false,
    help: false,
    version: false,
  };

  // Ignore optional positional subcommand 'copy'
  const normalized = argv.filter((a) => a !== 'copy');
  const it = normalized[Symbol.iterator]();
  for (let cur = it.next(); !cur.done; cur = it.next()) {
    const arg = cur.value as string;
    if (arg === '--dest') {
      const next = it.next();
      if (!next.done && typeof next.value === 'string') {
        opts.dest = next.value;
      }
      continue;
    }
    if (arg.startsWith('--dest=')) {
      opts.dest = arg.slice('--dest='.length);
      continue;
    }
    if (arg === '--force') { opts.force = true; continue; }
    if (arg === '--yes' || arg === '-y') { opts.yes = true; continue; }
    if (arg === '--dry-run') { opts.dryRun = true; continue; }
    if (arg === '--backup') { opts.backup = true; continue; }
    if (arg === '--verbose' || arg === '-v') { opts.verbose = true; continue; }
    if (arg === '--help' || arg === '-h') { opts.help = true; continue; }
    if (arg === '--version' || arg === '-V') { opts.version = true; continue; }
  }

  return opts;
}

export function formatHelp(): string {
  return [
    'workos-convex-sveltekit [copy] [options]',
    '',
    'Options:',
    '  --dest <path>     Destination directory (default: current working directory)',
    '  --force           Overwrite without prompting',
    '  --yes, -y         Assume yes to all prompts (non-interactive)',
    '  --dry-run         Print planned actions without writing files',
    '  --backup          Backup existing files before overwrite',
    '  --verbose, -v     Verbose logging',
    '  --help, -h        Show this help message',
    '  --version, -V     Show version',
  ].join('\n');
}


