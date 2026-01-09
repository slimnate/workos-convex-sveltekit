import readline from 'node:readline';
import fs from 'node:fs/promises';
import pc from 'picocolors';
import { createTwoFilesPatch } from 'diff';

type Choice = 'overwrite' | 'skip' | 'overwriteAll' | 'skipAll' | 'backup' | 'merge' | 'mergeAll';

export async function promptConflict(
	relPath: string,
	srcPath: string,
	destPath: string
): Promise<Choice> {
	// Show a unified diff before prompting
	try {
		const oldText = await fs.readFile(destPath, 'utf8').catch((err) => {
			console.error(`Failed to read existing file ${destPath}:`, err);
			return '';
		});
		const newText = await fs.readFile(srcPath, 'utf8').catch((err) => {
			console.error(`Failed to read template file ${srcPath}:`, err);
			return '';
		});
		// Normalize line endings to avoid noisy diffs from CRLF vs LF-only differences
		const oldNorm = oldText.replace(/\r\n/g, '\n');
		const newNorm = newText.replace(/\r\n/g, '\n');
		const patch = createTwoFilesPatch(
			relPath + ' (existing)',
			relPath + ' (template)',
			oldNorm,
			newNorm,
			'existing',
			'template'
		);

		console.log(pc.bold(`Diff for ${relPath}`));
		const lines = patch.split('\n');
		for (const line of lines) {
			if (line.startsWith('+') && !line.startsWith('+++')) {
				console.log(pc.green(line));
			} else if (line.startsWith('-') && !line.startsWith('---')) {
				console.log(pc.red(line));
			} else if (line.startsWith('@@')) {
				console.log(pc.cyan(line));
			} else if (
				line.startsWith('diff') ||
				line.startsWith('index') ||
				line.startsWith('Index') ||
				line.startsWith('---') ||
				line.startsWith('+++') ||
				line.startsWith('===')
			) {
				console.log(pc.dim(line));
			} else {
				console.log(line);
			}
		}
	} catch (err) {
		// If diff fails, continue without blocking prompts
		console.error(`Failed to generate unified diff for ${relPath}:`, err);
	}

	// Allow stdout to flush diff output before showing the prompt
	await new Promise((resolve) => setTimeout(resolve, 0));

	const question = `Conflict: ${relPath}\nChoose: [o]verwrite, [s]kip, [b]ackup, [m]erge, overwrite [a]ll, skip [A]ll, merge [M] all: `;
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer: string = await new Promise((resolve) => rl.question(question, resolve));
		const raw = (answer || '').trim();
		const a = raw.toLowerCase();
		// Check for "all" options first (before single-letter shortcuts)
		// Accept explicit uppercase 'A' shortcut for Skip All, as shown in the prompt
		if (raw === 'A' || a === 'all' || a === 'skip all' || a === 'skipall') return 'skipAll';
		if (raw === 'M' || a === 'merge all' || a === 'mergeall') return 'mergeAll';
		if (a === 'a' || a === 'overwrite all' || a === 'overwriteall') return 'overwriteAll';
		// Then check single actions
		if (a === 'o' || a === 'overwrite') return 'overwrite';
		if (a === 's' || a === 'skip') return 'skip';
		if (a === 'b' || a === 'backup') return 'backup';
		if (a === 'm' || a === 'merge') return 'merge';
		// default to skip on unknown
		return 'skip';
	} finally {
		rl.close();
	}
}
