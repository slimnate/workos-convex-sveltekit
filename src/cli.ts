#!/usr/bin/env node
import { parseArgs, formatHelp } from './cli/args';
import { resolvePaths } from './cli/paths';
import { copyTemplates } from './cli/copy';
import { logError, logInfo } from './cli/log';

async function main() {
	try {
		const opts = parseArgs(process.argv.slice(2));
		if (opts.help) {
			console.log(formatHelp());
			process.exit(0);
		}
		if (opts.version) {
			const version = process.env.npm_package_version || 'unknown';
			console.log(version);
			process.exit(0);
		}

		const paths = resolvePaths(opts.dest);
		logInfo('CLI initialized');
		const result = await copyTemplates({ opts, paths });
		if (!result.ok) {
			process.exit(1);
		}
	} catch (e) {
		logError(e);
		process.exit(1);
	}
}
main();
