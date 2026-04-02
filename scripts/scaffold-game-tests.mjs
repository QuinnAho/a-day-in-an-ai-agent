import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function resolveWorkspace(inputPath) {
  if (!inputPath) {
    fail('Usage: node scripts/scaffold-game-tests.mjs <sandbox/game-slug> [--force]');
  }

  const workspacePath = path.resolve(projectRoot, inputPath);
  const relativePath = path.relative(projectRoot, workspacePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    fail(`Workspace must stay inside the repo: ${inputPath}`);
  }

  return workspacePath;
}

function writeFileIfNeeded(filePath, contents, force) {
  if (existsSync(filePath) && !force) {
    return false;
  }

  writeFileSync(filePath, contents, 'utf8');
  return true;
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const workspaceArg = args.find((arg) => arg !== '--force');
const workspacePath = resolveWorkspace(workspaceArg);
const testsPath = path.join(workspacePath, 'tests');

mkdirSync(testsPath, { recursive: true });

const smokeTest = `import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const gameDir = path.resolve(testDir, '..');
const briefPath = path.join(gameDir, 'idea.txt');
const entryCandidates = [
  path.join(gameDir, 'index.html'),
  path.join(gameDir, 'game', 'index.html'),
  path.join(gameDir, 'public', 'index.html'),
  path.join(gameDir, 'dist', 'index.html'),
];
const entryPath = entryCandidates.find((candidate) => existsSync(candidate)) ?? null;

function isLocalReference(reference) {
  return (
    reference &&
    !reference.startsWith('#') &&
    !reference.startsWith('data:') &&
    !reference.startsWith('javascript:') &&
    !reference.startsWith('mailto:') &&
    !reference.startsWith('http://') &&
    !reference.startsWith('https://') &&
    !reference.startsWith('//')
  );
}

function collectLocalReferences(html) {
  const pattern = /(?:src|href)=["']([^"'<>]+)["']/g;
  const references = [];
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const reference = match[1].trim();
    if (isLocalReference(reference)) {
      references.push(reference);
    }
  }

  return references;
}

test('original brief file exists', () => {
  assert.equal(existsSync(briefPath), true, 'Expected sandbox/<game-slug>/idea.txt to exist');
});

test('original brief file is not empty', () => {
  const brief = readFileSync(briefPath, 'utf8').trim();
  assert.notEqual(brief, '', 'Expected sandbox/<game-slug>/idea.txt to contain the game brief');
});

test(
  'browser entry file exists after implementation',
  { skip: !entryPath },
  () => {
    assert.ok(entryPath, 'Expected an index.html entry file inside the sandbox workspace');
  },
);

test(
  'entry file includes at least one script tag',
  { skip: !entryPath },
  () => {
    const html = readFileSync(entryPath, 'utf8');
    assert.match(html, /<script\\b/i, 'Expected the entry file to include a script tag');
  },
);

test(
  'local asset references resolve from the entry file',
  { skip: !entryPath },
  () => {
    const html = readFileSync(entryPath, 'utf8');
    const entryDir = path.dirname(entryPath);
    const references = collectLocalReferences(html);

    for (const reference of references) {
      const assetPath = path.resolve(entryDir, reference);
      assert.equal(existsSync(assetPath), true, \`Missing local asset reference: \${reference}\`);
    }
  },
);
`;

const logicTest = `import test from 'node:test';

test(
  'add pure logic coverage as simulation modules appear',
  {
    skip:
      'Replace this placeholder with real tests for collision math, level generation, AI state, timers, and other pure logic as those modules are extracted.',
  },
  () => {},
);
`;

const created = [];

if (writeFileIfNeeded(path.join(testsPath, 'smoke.test.mjs'), smokeTest, force)) {
  created.push('tests/smoke.test.mjs');
}

if (writeFileIfNeeded(path.join(testsPath, 'logic.test.mjs'), logicTest, force)) {
  created.push('tests/logic.test.mjs');
}

if (created.length === 0) {
  console.log(`Game tests already exist in ${path.relative(projectRoot, testsPath)}`);
} else {
  console.log(`Scaffolded game tests in ${path.relative(projectRoot, testsPath)}`);
  for (const file of created) {
    console.log(`- ${file}`);
  }
}
