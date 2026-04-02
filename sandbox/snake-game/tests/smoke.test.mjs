import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const supportModuleFiles = [
  path.join(gameDir, 'src', 'config.js'),
  path.join(gameDir, 'src', 'simulation.js'),
  path.join(gameDir, 'src', 'rendering.js'),
  path.join(gameDir, 'src', 'input.js'),
  path.join(gameDir, 'src', 'ui.js'),
].filter((candidate) => existsSync(candidate));

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
    assert.match(html, /<script\b/i, 'Expected the entry file to include a script tag');
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
      assert.equal(existsSync(assetPath), true, `Missing local asset reference: ${reference}`);
    }
  },
);

test(
  'support browser modules import without runtime errors in Node',
  { skip: supportModuleFiles.length === 0 },
  async () => {
    for (const moduleFile of supportModuleFiles) {
      await assert.doesNotReject(
        async () => import(pathToFileURL(moduleFile).href),
        `Expected ${path.relative(gameDir, moduleFile)} to import cleanly`,
      );
    }
  },
);
