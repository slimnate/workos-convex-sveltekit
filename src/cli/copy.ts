import type { CliOptions } from './args';
import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'node:path';
import { logInfo, logWarn, logSuccess, logError } from './log';
import { promptConflict } from './prompts';

type PlanItem = { kind: 'create' | 'overwrite' | 'skip'; src: string; dest: string; rel: string };

/**
 * Merge two files using Git-style conflict markers for code files
 * Inserts conflict markers allowing manual resolution
 */
async function mergeFiles(
	srcPath: string,
	destPath: string,
	relPath: string,
	opts: CliOptions
): Promise<string> {
	const ext = path.extname(relPath).toLowerCase();

	// Code file extensions that support conflict markers
	const codeExtensions = [
		'.js',
		'.ts',
		'.jsx',
		'.tsx',
		'.svelte',
		'.vue',
		'.css',
		'.scss',
		'.html',
		'.json'
	];

	if (!codeExtensions.includes(ext)) {
		// For non-code files, just return template (overwrite)
		return fs.readFile(srcPath, 'utf8');
	}

	try {
		const [srcText, destText] = await Promise.all([
			fs.readFile(srcPath, 'utf8'),
			fs.readFile(destPath, 'utf8')
		]);

		// If files are identical, no conflict
		if (srcText === destText) {
			if (opts.verbose) logInfo(`SKIP    ${relPath}`);
			return destText;
		}

		// Insert Git-style conflict markers
		// Use "HEAD" for existing (destination) and "template" for new (source)
		const conflictMarker = `<<<<<<< HEAD
${destText}\n=======
${srcText}\n>>>>>>> template
`;

		return conflictMarker;
	} catch (e) {
		// Re-throw error so caller can handle it (will skip instead of overwrite)
		throw new Error(`Failed to merge file ${relPath}: ${(e as Error).message}`);
	}
}

export async function copyTemplates({
	opts,
	paths
}: {
	opts: CliOptions;
	paths: { templateRoot: string; destRoot: string };
}) {
	// 1) Discover files under templates
	const patterns = ['**/*'];
	const ignore = ['**/node_modules/**', '**/.git/**', '**/dist/**'];
	const relFiles = await fg(patterns, {
		cwd: paths.templateRoot,
		dot: true,
		onlyFiles: true,
		ignore
	});

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
			const [srcBuf, destBuf] = await Promise.all([fs.readFile(src), fs.readFile(dest)]);
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
		const hasConflicts = plan.some((p) => p.kind === 'overwrite');
		if (hasConflicts) {
			logWarn('Conflicts detected and no TTY. Re-run with --force or --yes.');
			return { ok: false, plan } as const;
		}
	}

	// 4) Dry-run output
	const creates = plan.filter((p) => p.kind === 'create').length;
	const overwrites = plan.filter((p) => p.kind === 'overwrite').length;
	const skips = plan.filter((p) => p.kind === 'skip').length;
	if (opts.dryRun) {
		if (opts.verbose) {
			for (const p of plan) {
				let label = p.kind === 'create' ? 'CREATE' : p.kind === 'overwrite' ? 'OVERWRITE' : 'SKIP';
				if (p.kind === 'overwrite' && opts.merge) {
					label = 'MERGE';
				}
				logInfo(`${label}  ${p.rel}`);
			}
		}
		const action = opts.merge ? 'merge' : 'overwrite';
		logInfo(`Plan: ${creates} create, ${overwrites} ${action}, ${skips} skip`);
		return { ok: true, plan } as const;
	}

	// 5) Execute plan (writes)
	let created = 0;
	let overwritten = 0;
	let merged = 0;
	let backedUp = 0;
	let skipped = 0;
	let hadError = false;

	let global: 'overwriteAll' | 'skipAll' | 'mergeAll' | null = null;

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
			let decision: 'overwrite' | 'skip' | 'backup' | 'merge' = 'overwrite';

			if (opts.merge) {
				decision = 'merge';
			} else if (opts.backup) {
				decision = 'backup';
			} else if (opts.force || opts.yes) {
				decision = 'overwrite';
			} else if (global === 'overwriteAll') {
				decision = 'overwrite';
			} else if (global === 'skipAll') {
				decision = 'skip';
			} else if (global === 'mergeAll') {
				decision = 'merge';
				if (opts.verbose) logInfo(`Using mergeAll for ${step.rel}`);
			} else if (process.stdout.isTTY) {
				const choice = await promptConflict(step.rel, step.src, step.dest);
				if (choice === 'overwriteAll') {
					global = 'overwriteAll';
					decision = 'overwrite';
				} else if (choice === 'skipAll') {
					global = 'skipAll';
					decision = 'skip';
				} else if (choice === 'mergeAll') {
					global = 'mergeAll';
					decision = 'merge';
					if (opts.verbose) logInfo(`MergeAll selected, will merge all remaining conflicts`);
				} else if (choice === 'overwrite') {
					decision = 'overwrite';
				} else if (choice === 'backup') {
					decision = 'backup';
				} else if (choice === 'merge') {
					decision = 'merge';
				} else {
					decision = 'skip';
				}
			} else {
				// Non-interactive conflict
				logWarn(`Conflict: ${step.rel}. Use --force, --yes, or --merge to resolve.`);
				return { ok: false, plan } as const;
			}

			if (decision === 'skip') {
				if (opts.verbose) logInfo(`SKIP    ${step.rel}`);
				skipped++;
				continue;
			}

			if (decision === 'merge') {
				try {
					const mergedContent = await mergeFiles(step.src, step.dest, step.rel, opts);
					await fs.writeFile(step.dest, mergedContent, 'utf8');
					merged++;
					if (opts.verbose) logInfo(`MERGE   ${step.rel}`);
					continue;
				} catch (e) {
					logWarn(`Failed to merge ${step.rel}, skipping: ${(e as Error).message}`);
					if (opts.verbose) logInfo(`SKIP    ${step.rel}`);
					skipped++;
					continue;
				}
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
	const parts = [];
	if (created > 0) parts.push(`${created} created`);
	if (overwritten > 0) parts.push(`${overwritten} overwritten`);
	if (merged > 0) parts.push(`${merged} merged`);
	if (backedUp > 0) parts.push(`${backedUp} backed up`);
	if (skipped > 0) parts.push(`${skipped} skipped`);
	logSuccess(`Done: ${parts.join(', ')}`);
	return { ok: !hadError, plan } as const;
}
