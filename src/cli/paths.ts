import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as fs from 'node:fs';

export function resolvePaths(destRoot: string) {
  // dist/cli.js sits in dist/; templates/ is at ../templates relative to dist/cli.js
  const templateRoot = fileURLToPath(new URL('../templates/', import.meta.url));
  const resolved = { templateRoot: path.resolve(templateRoot), destRoot: path.resolve(destRoot) };
  if (!fs.existsSync(resolved.templateRoot)) {
    throw new Error(`Templates directory not found at: ${resolved.templateRoot}`);
  }
  return resolved;
}


