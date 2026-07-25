#!/usr/bin/env node
/**
 * Ensure every markdown flashcard question has a UUID.
 *
 * Usage:
 *   node scripts/check-question-uuids.mjs                 # full repo, check only
 *   node scripts/check-question-uuids.mjs --fix           # full repo, write missing UUIDs (exit 0)
 *   node scripts/check-question-uuids.mjs --fix --changed # changed files; write + exit 1 if fixed
 *   node scripts/check-question-uuids.mjs --changed        # changed files, check only
 *
 * Pre-push (via husky) should use: --fix --changed
 * Reads git pre-push stdin (local_ref local_sha remote_ref remote_sha) when available.
 *
 * Valid question form:
 *   ### Question f5392a45-d4da-41d1-b9d8-c7503f37d2a8
 */

import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ZERO_SHA = "0".repeat(40);

/** Hex UUID shape: 8-4-4-4-12 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `### Question` optionally followed by a token */
const QUESTION_LINE_RE = /^(### Question)(?:[ \t]+(\S+))?[ \t]*$/;

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".husky",
  "dist",
  "build",
  "coverage",
]);

const SKIP_FILES = new Set([
  "AGENTS.md",
]);

function isIgnoredFile(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  const filename = path.basename(relPath);
  return (
    SKIP_FILES.has(relPath) ||
    SKIP_FILES.has(normalized) ||
    SKIP_FILES.has(filename)
  );
}

function parseArgs(argv) {
  return {
    fix: argv.includes("--fix"),
    changed: argv.includes("--changed"),
    // Hook mode: auto-fix working tree, then fail so the user commits
    failIfFixed: argv.includes("--changed") && argv.includes("--fix"),
  };
}

function git(cmd, { allowFail = false } = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    if (allowFail) return "";
    throw err;
  }
}

function isMissingOrInvalidSha(sha) {
  return !sha || sha === ZERO_SHA || /^0+$/.test(sha);
}

async function walkMarkdownFiles(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".") && entry.name !== ".github") {
      if (entry.isDirectory()) continue;
    }

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(full, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      const rel = path.relative(ROOT, full);
      if (!isIgnoredFile(rel)) {
        out.push(full);
      }
    }
  }
  return out;
}

async function readPrePushRanges() {
  if (process.stdin.isTTY) return [];

  const ranges = [];
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 4) continue;

    const [, localSha, , remoteSha] = parts;

    // Deleting a remote ref — nothing to check
    if (isMissingOrInvalidSha(localSha)) continue;

    if (isMissingOrInvalidSha(remoteSha)) {
      ranges.push({ type: "new-branch", localSha });
    } else {
      ranges.push({ type: "range", remoteSha, localSha });
    }
  }

  return ranges;
}

function relMarkdownPathsFromGit(output) {
  return output
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.toLowerCase().endsWith(".md") && !isIgnoredFile(f));
}

function unique(items) {
  return [...new Set(items)];
}

/**
 * Resolve which markdown files to inspect.
 * Returns { relPaths, pushSha? } where pushSha means content must be
 * validated from that commit (pre-push), not only the working tree.
 */
async function resolveTargets(changedOnly) {
  if (!changedOnly) {
    const abs = await walkMarkdownFiles(ROOT);
    return {
      relPaths: abs.map((f) => path.relative(ROOT, f)),
      pushSha: null,
    };
  }

  const ranges = await readPrePushRanges();

  if (ranges.length > 0) {
    // Use the last local tip if multiple refs are pushed; typically one.
    const localShas = ranges.map((r) => r.localSha);
    const pushSha = localShas[localShas.length - 1];
    const collected = [];

    for (const range of ranges) {
      if (range.type === "range") {
        collected.push(
          ...relMarkdownPathsFromGit(
            git(
              `git diff --name-only --diff-filter=ACMR ${range.remoteSha} ${range.localSha}`,
              { allowFail: true },
            ),
          ),
        );
      } else {
        let out = git(
          `git log --name-only --pretty=format: --diff-filter=ACMR ${range.localSha} --not --remotes`,
          { allowFail: true },
        );
        if (!out) {
          out = git(`git ls-tree -r --name-only ${range.localSha}`, {
            allowFail: true,
          });
        }
        collected.push(...relMarkdownPathsFromGit(out));
      }
    }

    return { relPaths: unique(collected), pushSha };
  }

  // Manual --changed (no pre-push stdin)
  const upstream = git("git rev-parse --abbrev-ref @{upstream}", {
    allowFail: true,
  });

  if (upstream) {
    const committed = relMarkdownPathsFromGit(
      git(`git diff --name-only --diff-filter=ACMR ${upstream}...HEAD`, {
        allowFail: true,
      }),
    );
    const dirty = relMarkdownPathsFromGit(
      git("git diff --name-only --diff-filter=ACMR HEAD", { allowFail: true }),
    );
    const untracked = relMarkdownPathsFromGit(
      git("git ls-files --others --exclude-standard", { allowFail: true }),
    );
    return {
      relPaths: unique([...committed, ...dirty, ...untracked]),
      pushSha: null,
    };
  }

  const dirty = relMarkdownPathsFromGit(
    git("git diff --name-only --diff-filter=ACMR HEAD", { allowFail: true }),
  );
  const untracked = relMarkdownPathsFromGit(
    git("git ls-files --others --exclude-standard", { allowFail: true }),
  );
  const combined = unique([...dirty, ...untracked]);
  if (combined.length > 0) {
    return { relPaths: combined, pushSha: null };
  }

  // No upstream and clean tree: fall back to all tracked markdown
  return {
    relPaths: relMarkdownPathsFromGit(
      git('git ls-files "*.md" "*.MD"', { allowFail: true }),
    ),
    pushSha: null,
  };
}

function readBlob(sha, relPath) {
  return git(`git show ${sha}:${shellQuote(relPath)}`, { allowFail: true });
}

function shellQuote(value) {
  // Safe enough for relative paths without newlines
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

async function fileExists(absPath) {
  try {
    return (await stat(absPath)).isFile();
  } catch {
    return false;
  }
}

function processContent(content, shouldFix) {
  const lines = content.split("\n");
  const issues = [];
  let changed = false;

  const newLines = lines.map((line, index) => {
    const match = line.match(QUESTION_LINE_RE);
    if (!match) return line;

    const [, prefix, token] = match;
    if (token && UUID_RE.test(token)) return line;

    const lineNo = index + 1;
    const reason = token
      ? `invalid UUID token "${token}"`
      : "missing UUID";

    if (!shouldFix) {
      issues.push({ line: lineNo, reason, fixed: false });
      return line;
    }

    const uuid = randomUUID();
    issues.push({ line: lineNo, reason, fixed: true, uuid });
    changed = true;
    return `${prefix} ${uuid}`;
  });

  return {
    content: newLines.join("\n"),
    issues,
    changed,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { relPaths, pushSha } = await resolveTargets(args.changed);

  if (relPaths.length === 0) {
    console.log(
      args.changed
        ? "No changed markdown files to check."
        : "No markdown files found.",
    );
    process.exit(0);
  }

  let totalIssues = 0;
  let totalFixed = 0;
  let pushBlocked = false;
  const fileReports = [];

  for (const rel of relPaths.sort()) {
    const abs = path.join(ROOT, rel);

    // Content that will be (or is) pushed — authoritative for hook mode
    let pushContent = null;
    if (pushSha) {
      pushContent = readBlob(pushSha, rel);
      if (!pushContent) {
        // File not in that commit (deleted / never added)
        continue;
      }
    }

    let workContent = null;
    if (await fileExists(abs)) {
      workContent = await readFile(abs, "utf8");
    }

    // Prefer validating push content when available; otherwise working tree
    const sourceContent = pushContent ?? workContent;
    if (sourceContent == null) continue;

    const sourceResult = processContent(sourceContent, false);
    if (sourceResult.issues.length === 0) {
      // Also ensure working tree stays compliant when fixing
      if (args.fix && workContent != null) {
        const workResult = processContent(workContent, true);
        if (workResult.changed) {
          await writeFile(abs, workResult.content, "utf8");
          totalFixed += workResult.issues.filter((i) => i.fixed).length;
          totalIssues += workResult.issues.length;
          fileReports.push({
            rel,
            issues: workResult.issues,
            changed: true,
            note: "working tree",
          });
        }
      }
      continue;
    }

    totalIssues += sourceResult.issues.length;

    if (args.fix) {
      // Always fix the working tree so the user can commit the result.
      // If working tree matches push content (or is missing), fix from source.
      const base = workContent ?? sourceContent;
      const fixed = processContent(base, true);
      if (fixed.changed) {
        await writeFile(abs, fixed.content, "utf8");
        totalFixed += fixed.issues.filter((i) => i.fixed).length;
      }

      // If the commit being pushed still lacks UUIDs, block even when
      // the working tree was already fixed earlier.
      if (pushSha && sourceResult.issues.length > 0) {
        pushBlocked = true;
      }

      fileReports.push({
        rel,
        issues: fixed.issues.length ? fixed.issues : sourceResult.issues.map((i) => ({
          ...i,
          fixed: false,
        })),
        changed: fixed.changed,
        note: pushSha ? "in commits being pushed" : undefined,
      });
    } else {
      fileReports.push({
        rel,
        issues: sourceResult.issues,
        changed: false,
        note: pushSha ? "in commits being pushed" : undefined,
      });
    }
  }

  if (fileReports.length === 0) {
    console.log(
      `✓ All questions have valid UUIDs (${relPaths.length} markdown file(s) checked).`,
    );
    process.exit(0);
  }

  for (const { rel, issues, changed, note } of fileReports) {
    const suffix = [
      changed ? "updated" : null,
      note ?? null,
    ]
      .filter(Boolean)
      .join(", ");
    console.log(`\n${rel}${suffix ? ` (${suffix})` : ""}`);
    for (const issue of issues) {
      if (issue.fixed) {
        console.log(`  L${issue.line}: ${issue.reason} → added ${issue.uuid}`);
      } else {
        console.log(`  L${issue.line}: ${issue.reason}`);
      }
    }
  }

  console.log("");

  if (args.fix) {
    if (totalFixed > 0) {
      console.log(
        `Fixed ${totalFixed} question(s) across ${fileReports.length} file(s) in the working tree.`,
      );
    }

    if (args.failIfFixed && (totalFixed > 0 || pushBlocked)) {
      console.error(
        "\nPush blocked: one or more questions were missing a valid UUID.",
      );
      console.error(
        "UUIDs have been written to your working tree where needed.",
      );
      console.error("Review, commit the changes, then push again.\n");
      process.exit(1);
    }

    process.exit(0);
  }

  console.error(
    `Found ${totalIssues} question(s) without a valid UUID in ${fileReports.length} file(s).`,
  );
  console.error("Run: npm run fix:question-uuids\n");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
