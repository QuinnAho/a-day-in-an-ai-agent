import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sandboxRoot = path.join(projectRoot, 'sandbox');

function buildNodeTestArgs(files) {
  const args = [];
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);

  // Restricted sandboxes can block the subprocess spawning used by the
  // default file-isolated runner on newer Node versions.
  if (nodeMajor >= 22) {
    args.push('--experimental-test-isolation=none');
  }

  args.push('--test', ...files);
  return args;
}

function listDirectories(rootPath) {
  if (!existsSync(rootPath)) {
    return [];
  }

  return readdirSync(rootPath)
    .map((name) => path.join(rootPath, name))
    .filter((fullPath) => statSync(fullPath).isDirectory());
}

function walkForTests(rootPath) {
  const files = [];

  if (!existsSync(rootPath)) {
    return files;
  }

  for (const entry of readdirSync(rootPath)) {
    const fullPath = path.join(rootPath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walkForTests(fullPath));
      continue;
    }

    if (/\.test\.(mjs|js|cjs)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

const gameDirs = listDirectories(sandboxRoot).filter((directory) =>
  existsSync(path.join(directory, 'idea.txt')),
);

if (gameDirs.length === 0) {
  console.log('No sandbox game workspaces found. Skipping game tests.');
  process.exit(10);
}

const missingTests = [];
const testFiles = [];

for (const gameDir of gameDirs) {
  const testsDir = path.join(gameDir, 'tests');
  const relativeGameDir = path.relative(projectRoot, gameDir);

  if (!existsSync(testsDir)) {
    missingTests.push(`${relativeGameDir} (missing tests directory)`);
    continue;
  }

  const discovered = walkForTests(testsDir);
  if (discovered.length === 0) {
    missingTests.push(`${relativeGameDir} (no test files found)`);
    continue;
  }

  testFiles.push(...discovered);
}

if (missingTests.length > 0) {
  console.error('ERROR: Missing sandbox game tests:');
  for (const entry of missingTests) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log('Running sandbox game tests:');
for (const file of testFiles) {
  console.log(`- ${path.relative(projectRoot, file)}`);
}

const result = spawnSync(process.execPath, buildNodeTestArgs(testFiles), {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
