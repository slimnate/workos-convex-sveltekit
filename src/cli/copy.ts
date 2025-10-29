import type { CliOptions } from './args';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'node:path';
import { logInfo, logWarn, logSuccess, logError } from './log';
import { promptConflict } from './prompts';

type PlanItem = { kind: 'create'|'overwrite'|'skip'; src: string; dest: string; rel: string };

export async function copyTemplates({ opts, paths }: { opts: CliOptions; paths: { templateRoot: string; destRoot: string } }) {
  // 1) Discover files under templates
  const patterns = ['**/*'];
  const ignore = ['**/node_modules/**', '**/.git/**', '**/dist/**'];
  const relFiles = await fg(patterns, { cwd: paths.templateRoot, dot: true, onlyFiles: true, ignore });

  // 2) Build plan
  const plan: PlanItem[] = [];
  for (const rel of relFiles) {
    const src = path.join(paths.templateRoot, rel);
    const dest = path.join(paths.destRoot, rel);
    const exists = await fs.pathExists(dest);
    if (!exists) {
      plan.push({ kind: 'create', src, dest, rel });
      continue;
    }
    // If destination exists, auto-skip when contents are identical
    try {
      const [srcBuf, destBuf] = await Promise.all([
        fs.readFile(src),
        fs.readFile(dest)
      ]);
      if (srcBuf.equals(destBuf)) {
        plan.push({ kind: 'skip', src, dest, rel });
      } else {
        plan.push({ kind: 'overwrite', src, dest, rel });
      }
    } catch {
      // On read error, fall back to prompting path
      plan.push({ kind: 'overwrite', src, dest, rel });
    }
  }

  // 3) Non-interactive conflict handling (no writes yet)
  if (!process.stdout.isTTY && !opts.force && !opts.yes) {
    const hasConflicts = plan.some(p => p.kind === 'overwrite');
    if (hasConflicts) {
      logWarn('Conflicts detected and no TTY. Re-run with --force or --yes.');
      return { ok: false, plan } as const;
    }
  }

  // 4) Dry-run output
  const creates = plan.filter(p => p.kind === 'create').length;
  const overwrites = plan.filter(p => p.kind === 'overwrite').length;
  const skips = plan.filter(p => p.kind === 'skip').length;
  if (opts.dryRun) {
    if (opts.verbose) {
      for (const p of plan) {
        const label = p.kind === 'create' ? 'CREATE' : p.kind === 'overwrite' ? 'OVERWRITE' : 'SKIP';
        logInfo(`${label}  ${p.rel}`);
      }
    }
    logInfo(`Plan: ${creates} create, ${overwrites} overwrite, ${skips} skip`);
    return { ok: true, plan } as const;
  }

  // 5) Execute plan (writes)
  let created = 0;
  let overwritten = 0;
  let backedUp = 0;
  let skipped = 0;
  let hadError = false;

  let global: 'overwriteAll'|'skipAll'|null = null;

  for (const step of plan) {
    try {
      // Ensure directory
      await fs.ensureDir(path.dirname(step.dest));

      // auto-skip identical files identified during planning
      if (step.kind === 'skip') {
        if (opts.verbose) logInfo(`SKIP    ${step.rel}`);
        skipped++;
        continue;
      }

      if (step.kind === 'create') {
        if (opts.verbose) logInfo(`CREATE  ${step.rel}`);
        await fs.copy(step.src, step.dest, { overwrite: false, errorOnExist: false });
        created++;
        continue;
      }

      // overwrite conflict
      let decision: 'overwrite'|'skip'|'backup' = 'overwrite';

      if (opts.backup) {
        decision = 'backup';
      } else if (opts.force || opts.yes) {
        decision = 'overwrite';
      } else if (global === 'overwriteAll') {
        decision = 'overwrite';
      } else if (global === 'skipAll') {
        decision = 'skip';
      } else if (process.stdout.isTTY) {
        const choice = await promptConflict(step.rel, step.src, step.dest);
        if (choice === 'overwriteAll') { global = 'overwriteAll'; decision = 'overwrite'; }
        else if (choice === 'skipAll') { global = 'skipAll'; decision = 'skip'; }
        else if (choice === 'overwrite') { decision = 'overwrite'; }
        else if (choice === 'backup') { decision = 'backup'; }
        else { decision = 'skip'; }
      } else {
        // Non-interactive conflict
        logWarn(`Conflict: ${step.rel}. Use --force or --yes to overwrite.`);
        return { ok: false, plan } as const;
      }

      if (decision === 'skip') {
        if (opts.verbose) logInfo(`SKIP    ${step.rel}`);
        skipped++;
        continue;
      }

      if (decision === 'backup') {
        const backupPath = `${step.dest}.bak.${Date.now()}`;
        await fs.move(step.dest, backupPath, { overwrite: true });
        backedUp++;
        if (opts.verbose) logInfo(`BACKUP  ${step.rel} -> ${path.basename(backupPath)}`);
      }

      await fs.copy(step.src, step.dest, { overwrite: true, errorOnExist: false });
      overwritten++;
      if (opts.verbose) logInfo(`WRITE   ${step.rel}`);
    } catch (e) {
      hadError = true;
      logError(`Error processing ${step.rel}: ${(e as Error).message}`);
    }
  }

  // 6) Summary
  logSuccess(`Done: ${created} created, ${overwritten} overwritten, ${backedUp} backed up, ${skipped} skipped`);
  return { ok: !hadError, plan } as const;
}


