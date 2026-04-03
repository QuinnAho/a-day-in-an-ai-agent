#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node scripts/finalize-game-release.mjs <game-slug> [--apply]

Behavior:
  - Creates a release bundle under sandbox/<game-slug>/release/<timestamp>/
  - Copies the spec, workflow docs, logs, and intake trail into that release folder
  - Restores everything outside sandbox/<game-slug>/ back to the baseline commit captured when the game was created

Safety:
  - Dry-run by default
  - Use --apply to write the release bundle and perform the cleanup
`);
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  if (result.error) {
    if (allowFailure) {
      return {
        status: result.status ?? 1,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? result.error.message,
      };
    }

    fail(result.error.message);
  }

  if (!allowFailure && result.status !== 0) {
    fail((result.stderr || result.stdout || `Command failed: ${command}`).trim());
  }

  return {
    status: result.status ?? 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function isDirectory(filePath) {
  return existsSync(filePath) && statSync(filePath).isDirectory();
}

function timestampString() {
  const now = new Date();
  const parts = [
    now.getFullYear().toString().padStart(4, '0'),
    (now.getMonth() + 1).toString().padStart(2, '0'),
    now.getDate().toString().padStart(2, '0'),
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
  ];

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`;
}

function copyIntoRelease(sourcePath, destinationPath) {
  if (!existsSync(sourcePath)) {
    return false;
  }

  mkdirSync(path.dirname(destinationPath), { recursive: true });
  cpSync(sourcePath, destinationPath, { recursive: true });
  return true;
}

function findArtifactPaths(gameDir) {
  const candidates = [
    path.join(gameDir, 'index.html'),
    path.join(gameDir, 'game', 'index.html'),
    path.join(gameDir, 'public', 'index.html'),
    path.join(gameDir, 'dist', 'index.html'),
  ];

  return candidates
    .filter((candidate) => existsSync(candidate))
    .map((candidate) => toPosix(path.relative(projectRoot, candidate)));
}

function parseBaselineRef(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || !line.includes('=')) {
      continue;
    }

    const [key, ...rest] = line.split('=');
    values[key] = rest.join('=');
  }

  return values;
}

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const positional = args.filter((arg) => arg !== '--apply');

if (positional.length !== 1 || positional.includes('--help') || positional.includes('-h')) {
  usage();
  process.exit(positional.length === 0 ? 1 : 0);
}

const gameSlug = positional[0];

if (!/^[a-z0-9-]+$/.test(gameSlug)) {
  fail(`Invalid game slug: ${gameSlug}`);
}

run('git', ['rev-parse', '--is-inside-work-tree']);

const sandboxRel = toPosix(path.join('sandbox', gameSlug));
const gameDir = path.join(projectRoot, 'sandbox', gameSlug);
if (!isDirectory(gameDir)) {
  fail(`Game workspace not found: ${sandboxRel}`);
}

const baselineRefPath = path.join(gameDir, 'baseline-ref.txt');
if (!existsSync(baselineRefPath)) {
  fail(`Missing baseline ref file: ${toPosix(path.relative(projectRoot, baselineRefPath))}`);
}

const baseline = parseBaselineRef(baselineRefPath);
const baselineCommit = baseline.baseline_commit;
if (!baselineCommit || baselineCommit === 'unknown') {
  fail(`Baseline commit is missing in ${toPosix(path.relative(projectRoot, baselineRefPath))}`);
}

const timestamp = timestampString();
const releaseRel = toPosix(path.join('sandbox', gameSlug, 'release', timestamp));
const releaseDir = path.join(projectRoot, 'sandbox', gameSlug, 'release', timestamp);
const specRel = `specs/${gameSlug}.md`;
const specPath = path.join(projectRoot, specRel);
const artifactPaths = findArtifactPaths(gameDir);
const gameCommitPattern = `^${gameSlug}:`;

const copyPlan = [
  { source: specPath, destination: 'spec.md', label: specRel },
  { source: path.join(projectRoot, 'AGENTS.md'), destination: 'workflow/AGENTS.md', label: 'AGENTS.md' },
  { source: path.join(projectRoot, 'STATUS.md'), destination: 'workflow/STATUS.md', label: 'STATUS.md' },
  { source: path.join(projectRoot, 'PROJECT.md'), destination: 'workflow/PROJECT.md', label: 'PROJECT.md' },
  { source: baselineRefPath, destination: 'workflow/baseline-ref.txt', label: `${sandboxRel}/baseline-ref.txt` },
  { source: path.join(gameDir, 'idea.txt'), destination: 'intake/idea.txt', label: `${sandboxRel}/idea.txt` },
  { source: path.join(gameDir, 'clarification-questions.txt'), destination: 'intake/clarification-questions.txt', label: `${sandboxRel}/clarification-questions.txt` },
  { source: path.join(gameDir, 'clarifications.txt'), destination: 'intake/clarifications.txt', label: `${sandboxRel}/clarifications.txt` },
  { source: path.join(gameDir, 'intake.md'), destination: 'intake/intake.md', label: `${sandboxRel}/intake.md` },
  { source: path.join(gameDir, 'spec-question-run.log'), destination: 'logs/spec-question-run.log', label: `${sandboxRel}/spec-question-run.log` },
  { source: path.join(gameDir, 'spec-generation-run.log'), destination: 'logs/spec-generation-run.log', label: `${sandboxRel}/spec-generation-run.log` },
  { source: path.join(projectRoot, '.codex-logs'), destination: 'logs/codex-session-logs', label: '.codex-logs/' },
];

const includedFiles = copyPlan.filter((entry) => existsSync(entry.source));
const branchName = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
const currentHead = run('git', ['rev-parse', 'HEAD']).stdout.trim();
const trackedPreview = run('git', ['diff', '--name-status', baselineCommit, '--', '.', `:(exclude)${sandboxRel}`], { allowFailure: true }).stdout.trim();
const untrackedPreview = run('git', ['clean', '-nd', '--', '.', `:(exclude)${sandboxRel}`], { allowFailure: true }).stdout.trim();
const ignoredPreview = run('git', ['clean', '-ndX', '--', '.', `:(exclude)${sandboxRel}`], { allowFailure: true }).stdout.trim();
const gitStatusBefore = run('git', ['status', '--short', '--branch'], { allowFailure: true }).stdout.trim();
const gameCommitHistory = run('git', ['log', '--oneline', '--decorate', '--grep', gameCommitPattern], { allowFailure: true }).stdout.trim();
const relevantHistory = run('git', ['log', '--oneline', '--decorate', `${baselineCommit}..HEAD`, '--', sandboxRel, specRel, 'AGENTS.md', 'STATUS.md'], { allowFailure: true }).stdout.trim();

const summary = `# Release Sheet: ${gameSlug}

## Metadata

- Generated at: ${new Date().toISOString()}
- Branch: ${branchName}
- Baseline commit: ${baselineCommit}
- Current HEAD: ${currentHead}
- Game workspace: ${sandboxRel}
- Release bundle: ${releaseRel}

## Browser Artifact Paths

${artifactPaths.length > 0 ? artifactPaths.map((entry) => `- \`${entry}\``).join('\n') : '- No browser artifact found yet.'}

## Included Snapshots

${includedFiles.length > 0 ? includedFiles.map((entry) => `- \`${entry.label}\` -> \`${toPosix(path.join(releaseRel, entry.destination))}\``).join('\n') : '- No snapshot inputs were found.'}

## Game Commit Trail

\`\`\`text
${gameCommitHistory || '(no slug-prefixed commits found yet)'}
\`\`\`

## Relevant History Since Baseline

\`\`\`text
${relevantHistory || '(no relevant history found)'}
\`\`\`

## Status Before Cleanup

\`\`\`text
${gitStatusBefore || '(clean working tree)'}
\`\`\`

## Cleanup Preview

### Tracked Changes Outside ${sandboxRel}

\`\`\`text
${trackedPreview || '(none)'}
\`\`\`

### Untracked Files Outside ${sandboxRel}

\`\`\`text
${untrackedPreview || '(none)'}
\`\`\`

### Ignored Files Outside ${sandboxRel}

\`\`\`text
${ignoredPreview || '(none)'}
\`\`\`
`;

const manifest = {
  generatedAt: new Date().toISOString(),
  gameSlug,
  branchName,
  baselineCommit,
  currentHead,
  gameWorkspace: sandboxRel,
  releaseBundle: releaseRel,
  artifactPaths,
  includedSnapshots: includedFiles.map((entry) => ({
    source: entry.label,
    destination: toPosix(path.join(releaseRel, entry.destination)),
  })),
};

console.log(`Game workspace: ${sandboxRel}`);
console.log(`Baseline commit: ${baselineCommit}`);
console.log(`Release bundle: ${releaseRel}`);
console.log('');
console.log('Artifacts:');
if (artifactPaths.length === 0) {
  console.log('- none found');
} else {
  for (const artifactPath of artifactPaths) {
    console.log(`- ${artifactPath}`);
  }
}
console.log('');
console.log('Cleanup preview outside keep path:');
console.log(trackedPreview || '(no tracked changes)');
console.log(untrackedPreview || '(no untracked files)');
console.log(ignoredPreview || '(no ignored files)');

if (!apply) {
  console.log('');
  console.log('Dry run only. Re-run with --apply to create the release bundle and reset everything outside the game workspace to the recorded baseline commit.');
  process.exit(0);
}

mkdirSync(releaseDir, { recursive: true });

for (const entry of includedFiles) {
  copyIntoRelease(entry.source, path.join(releaseDir, entry.destination));
}

writeFileSync(path.join(releaseDir, 'release-sheet.md'), summary, 'utf8');
writeFileSync(path.join(releaseDir, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(path.join(releaseDir, 'git-status-before.txt'), `${gitStatusBefore || '(clean working tree)'}\n`, 'utf8');
writeFileSync(path.join(releaseDir, 'game-commit-history.txt'), `${gameCommitHistory || '(no slug-prefixed commits found yet)'}\n`, 'utf8');
writeFileSync(path.join(releaseDir, 'relevant-history.txt'), `${relevantHistory || '(no relevant history found)'}\n`, 'utf8');

run('git', ['restore', '--source', baselineCommit, '--staged', '--worktree', '--', '.', `:(exclude)${sandboxRel}`]);
run('git', ['clean', '-fd', '--', '.', `:(exclude)${sandboxRel}`]);
run('git', ['clean', '-fdX', '--', '.', `:(exclude)${sandboxRel}`]);

console.log('');
console.log(`Release bundle written to ${releaseRel}`);
console.log(`Everything outside ${sandboxRel} has been restored to baseline commit ${baselineCommit} and cleaned.`);
