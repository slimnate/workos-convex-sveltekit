import readline from 'node:readline';
import * as fs from 'fs-extra';
import pc from 'picocolors';
import { createTwoFilesPatch } from 'diff';

type Choice = 'overwrite'|'skip'|'overwriteAll'|'skipAll'|'backup';

export async function promptConflict(relPath: string, srcPath: string, destPath: string): Promise<Choice> {
  // Show a unified diff before prompting
  try {
    const oldText = await fs.readFile(destPath, 'utf8').catch(() => '');
    const newText = await fs.readFile(srcPath, 'utf8').catch(() => '');
    const patch = createTwoFilesPatch(relPath + ' (existing)', relPath + ' (template)', oldText, newText, 'existing', 'template', { context: 3 });
    const lines = patch.split('\n');
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        console.log(pc.green(line));
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        console.log(pc.red(line));
      } else if (line.startsWith('@@')) {
        console.log(pc.cyan(line));
      } else if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
        console.log(pc.dim(line));
      } else {
        console.log(line);
      }
    }
  } catch {
    // If diff fails, continue without blocking prompts
  }

  const question = `Conflict: ${relPath}\nChoose: [o]verwrite, [s]kip, [b]ackup, overwrite [a]ll, skip [A]ll: `;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer: string = await new Promise((resolve) => rl.question(question, resolve));
    const a = (answer || '').trim().toLowerCase();
    if (a === 'o' || a === 'overwrite') return 'overwrite';
    if (a === 's' || a === 'skip') return 'skip';
    if (a === 'b' || a === 'backup') return 'backup';
    if (a === 'a' || a === 'overwrite all' || a === 'overwriteall') return 'overwriteAll';
    if (a === 'all' || a === 'skip all' || a === 'skipall' || a === 'A') return 'skipAll';
    // default to skip on unknown
    return 'skip';
  } finally {
    rl.close();
  }
}



