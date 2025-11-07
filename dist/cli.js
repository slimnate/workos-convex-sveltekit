import { fileURLToPath } from 'url';
import path2 from 'path';
import * as fs from 'fs';
import fg from 'fast-glob';
import * as fs3 from 'fs-extra';
import pc2 from 'picocolors';
import readline from 'readline';
import fs2 from 'fs/promises';
import { createTwoFilesPatch } from 'diff';

// src/cli/args.ts
function parseArgs(argv) {
  const opts = {
    dest: process.cwd(),
    force: false,
    yes: false,
    dryRun: false,
    backup: false,
    verbose: false,
    help: false,
    version: false
  };
  const normalized = argv.filter((a) => a !== "copy");
  const it = normalized[Symbol.iterator]();
  for (let cur = it.next(); !cur.done; cur = it.next()) {
    const arg = cur.value;
    if (arg === "--dest") {
      const next = it.next();
      if (!next.done && typeof next.value === "string") {
        opts.dest = next.value;
      }
      continue;
    }
    if (arg.startsWith("--dest=")) {
      opts.dest = arg.slice("--dest=".length);
      continue;
    }
    if (arg === "--force") {
      opts.force = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      opts.yes = true;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--backup") {
      opts.backup = true;
      continue;
    }
    if (arg === "--verbose" || arg === "-v") {
      opts.verbose = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--version" || arg === "-V") {
      opts.version = true;
      continue;
    }
  }
  return opts;
}
function formatHelp() {
  return [
    "workos-convex-sveltekit [copy] [options]",
    "",
    "Options:",
    "  --dest <path>     Destination directory (default: current working directory)",
    "  --force           Overwrite without prompting",
    "  --yes, -y         Assume yes to all prompts (non-interactive)",
    "  --dry-run         Print planned actions without writing files",
    "  --backup          Backup existing files before overwrite",
    "  --verbose, -v     Verbose logging",
    "  --help, -h        Show this help message",
    "  --version, -V     Show version"
  ].join("\n");
}
function resolvePaths(destRoot) {
  const templateRoot = fileURLToPath(new URL("../templates/", import.meta.url));
  const resolved = { templateRoot: path2.resolve(templateRoot), destRoot: path2.resolve(destRoot) };
  if (!fs.existsSync(resolved.templateRoot)) {
    throw new Error(`Templates directory not found at: ${resolved.templateRoot}`);
  }
  return resolved;
}
function logInfo(msg) {
  console.log(pc2.cyan(String(msg)));
}
function logWarn(msg) {
  console.warn(pc2.yellow(String(msg)));
}
function logSuccess(msg) {
  console.log(pc2.green(String(msg)));
}
function logError(err2) {
  console.error(pc2.red(String(err2)));
}
async function promptConflict(relPath, srcPath, destPath) {
  try {
    const oldText = await fs2.readFile(destPath, "utf8").catch(() => {
      console.error(`Failed to read existing file ${destPath}:`, err);
      return "";
    });
    const newText = await fs2.readFile(srcPath, "utf8").catch((err2) => {
      console.error(`Failed to read template file ${srcPath}:`, err2);
      return "";
    });
    const oldNorm = oldText.replace(/\r\n/g, "\n");
    const newNorm = newText.replace(/\r\n/g, "\n");
    const patch = createTwoFilesPatch(
      relPath + " (existing)",
      relPath + " (template)",
      oldNorm,
      newNorm,
      "existing",
      "template"
    );
    console.log(pc2.bold(`Diff for ${relPath}`));
    const lines = patch.split("\n");
    for (const line of lines) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        console.log(pc2.green(line));
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        console.log(pc2.red(line));
      } else if (line.startsWith("@@")) {
        console.log(pc2.cyan(line));
      } else if (line.startsWith("diff") || line.startsWith("index") || line.startsWith("Index") || line.startsWith("---") || line.startsWith("+++") || line.startsWith("===")) {
        console.log(pc2.dim(line));
      } else {
        console.log(line);
      }
    }
  } catch (err2) {
    console.error(`Failed to generate unified diff for ${relPath}:`, err2);
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  const question = `Conflict: ${relPath}
Choose: [o]verwrite, [s]kip, [b]ackup, overwrite [a]ll, skip [A]ll: `;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise((resolve) => rl.question(question, resolve));
    const raw = (answer || "").trim();
    const a = raw.toLowerCase();
    if (raw === "A" || a === "all" || a === "skip all" || a === "skipall") return "skipAll";
    if (a === "o" || a === "overwrite") return "overwrite";
    if (a === "s" || a === "skip") return "skip";
    if (a === "b" || a === "backup") return "backup";
    if (a === "a" || a === "overwrite all" || a === "overwriteall") return "overwriteAll";
    return "skip";
  } finally {
    rl.close();
  }
}

// src/cli/copy.ts
async function copyTemplates({ opts, paths }) {
  const patterns = ["**/*"];
  const ignore = ["**/node_modules/**", "**/.git/**", "**/dist/**"];
  const relFiles = await fg(patterns, { cwd: paths.templateRoot, dot: true, onlyFiles: true, ignore });
  const plan = [];
  for (const rel of relFiles) {
    const src = path2.join(paths.templateRoot, rel);
    const dest = path2.join(paths.destRoot, rel);
    const exists = await fs3.pathExists(dest);
    if (!exists) {
      plan.push({ kind: "create", src, dest, rel });
      continue;
    }
    try {
      const [srcBuf, destBuf] = await Promise.all([
        fs3.readFile(src),
        fs3.readFile(dest)
      ]);
      if (srcBuf.equals(destBuf)) {
        plan.push({ kind: "skip", src, dest, rel });
      } else {
        plan.push({ kind: "overwrite", src, dest, rel });
      }
    } catch {
      plan.push({ kind: "overwrite", src, dest, rel });
    }
  }
  if (!process.stdout.isTTY && !opts.force && !opts.yes) {
    const hasConflicts = plan.some((p) => p.kind === "overwrite");
    if (hasConflicts) {
      logWarn("Conflicts detected and no TTY. Re-run with --force or --yes.");
      return { ok: false, plan };
    }
  }
  const creates = plan.filter((p) => p.kind === "create").length;
  const overwrites = plan.filter((p) => p.kind === "overwrite").length;
  const skips = plan.filter((p) => p.kind === "skip").length;
  if (opts.dryRun) {
    if (opts.verbose) {
      for (const p of plan) {
        const label = p.kind === "create" ? "CREATE" : p.kind === "overwrite" ? "OVERWRITE" : "SKIP";
        logInfo(`${label}  ${p.rel}`);
      }
    }
    logInfo(`Plan: ${creates} create, ${overwrites} overwrite, ${skips} skip`);
    return { ok: true, plan };
  }
  let created = 0;
  let overwritten = 0;
  let backedUp = 0;
  let skipped = 0;
  let hadError = false;
  let global = null;
  for (const step of plan) {
    try {
      await fs3.ensureDir(path2.dirname(step.dest));
      if (step.kind === "skip") {
        if (opts.verbose) logInfo(`SKIP    ${step.rel}`);
        skipped++;
        continue;
      }
      if (step.kind === "create") {
        if (opts.verbose) logInfo(`CREATE  ${step.rel}`);
        await fs3.copy(step.src, step.dest, { overwrite: false, errorOnExist: false });
        created++;
        continue;
      }
      let decision = "overwrite";
      if (opts.backup) {
        decision = "backup";
      } else if (opts.force || opts.yes) {
        decision = "overwrite";
      } else if (global === "overwriteAll") {
        decision = "overwrite";
      } else if (global === "skipAll") {
        decision = "skip";
      } else if (process.stdout.isTTY) {
        const choice = await promptConflict(step.rel, step.src, step.dest);
        if (choice === "overwriteAll") {
          global = "overwriteAll";
          decision = "overwrite";
        } else if (choice === "skipAll") {
          global = "skipAll";
          decision = "skip";
        } else if (choice === "overwrite") {
          decision = "overwrite";
        } else if (choice === "backup") {
          decision = "backup";
        } else {
          decision = "skip";
        }
      } else {
        logWarn(`Conflict: ${step.rel}. Use --force or --yes to overwrite.`);
        return { ok: false, plan };
      }
      if (decision === "skip") {
        if (opts.verbose) logInfo(`SKIP    ${step.rel}`);
        skipped++;
        continue;
      }
      if (decision === "backup") {
        const backupPath = `${step.dest}.bak.${Date.now()}`;
        await fs3.move(step.dest, backupPath, { overwrite: true });
        backedUp++;
        if (opts.verbose) logInfo(`BACKUP  ${step.rel} -> ${path2.basename(backupPath)}`);
      }
      await fs3.copy(step.src, step.dest, { overwrite: true, errorOnExist: false });
      overwritten++;
      if (opts.verbose) logInfo(`WRITE   ${step.rel}`);
    } catch (e) {
      hadError = true;
      logError(`Error processing ${step.rel}: ${e.message}`);
    }
  }
  logSuccess(`Done: ${created} created, ${overwritten} overwritten, ${backedUp} backed up, ${skipped} skipped`);
  return { ok: !hadError, plan };
}

// src/cli.ts
async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.help) {
      console.log(formatHelp());
      process.exit(0);
    }
    if (opts.version) {
      const version = process.env.npm_package_version || "unknown";
      console.log(version);
      process.exit(0);
    }
    const paths = resolvePaths(opts.dest);
    logInfo("CLI initialized");
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
//# sourceMappingURL=cli.js.map
//# sourceMappingURL=cli.js.map