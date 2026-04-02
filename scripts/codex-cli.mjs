#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const isWindows = process.platform === "win32";

function isAbsolutePath(value) {
  return value.includes(path.sep) || path.isAbsolute(value);
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildWindowsCandidates() {
  const candidates = [];
  const appData = process.env.APPDATA;
  const homeDir = process.env.USERPROFILE || os.homedir();
  const envOverride = process.env.CODEX_CLI_BIN;

  if (envOverride) {
    candidates.push({
      label: envOverride,
      command: envOverride,
      extraArgs: [],
      shell: envOverride.endsWith(".cmd") || envOverride.endsWith(".bat"),
    });
  }

  if (appData) {
    const globalCodexJs = path.join(
      appData,
      "npm",
      "node_modules",
      "@openai",
      "codex",
      "bin",
      "codex.js",
    );
    candidates.push({
      label: globalCodexJs,
      command: process.execPath,
      extraArgs: [globalCodexJs],
      shell: false,
    });

    const globalCodexCmd = path.join(appData, "npm", "codex.cmd");
    candidates.push({
      label: globalCodexCmd,
      command: globalCodexCmd,
      extraArgs: [],
      shell: true,
    });
  }

  if (homeDir) {
    const sandboxCodexExe = path.join(
      homeDir,
      ".codex",
      ".sandbox-bin",
      "codex.exe",
    );
    candidates.push({
      label: sandboxCodexExe,
      command: sandboxCodexExe,
      extraArgs: [],
      shell: false,
    });
  }

  candidates.push(
    {
      label: "codex.cmd",
      command: "codex.cmd",
      extraArgs: [],
      shell: true,
    },
    {
      label: "codex.exe",
      command: "codex.exe",
      extraArgs: [],
      shell: false,
    },
    {
      label: "codex",
      command: "codex",
      extraArgs: [],
      shell: false,
    },
  );

  return uniqueBy(candidates, (candidate) => candidate.label);
}

function buildUnixCandidates() {
  const envOverride = process.env.CODEX_CLI_BIN;
  const candidates = [];

  if (envOverride) {
    candidates.push({
      label: envOverride,
      command: envOverride,
      extraArgs: [],
      shell: false,
    });
  }

  candidates.push({
    label: "codex",
    command: "codex",
    extraArgs: [],
    shell: false,
  });

  return uniqueBy(candidates, (candidate) => candidate.label);
}

function canAttempt(candidate) {
  if (!isAbsolutePath(candidate.command)) {
    return true;
  }

  if (!existsSync(candidate.command)) {
    return false;
  }

  return candidate.extraArgs.every((arg) => {
    if (!isAbsolutePath(arg)) {
      return true;
    }
    return existsSync(arg);
  });
}

function tryCandidate(candidate) {
  const result = spawnSync(
    candidate.command,
    [...candidate.extraArgs, ...args],
    {
      stdio: "inherit",
      shell: candidate.shell,
      windowsHide: false,
    },
  );

  if (result.error) {
    return { launched: false, error: result.error };
  }

  return {
    launched: true,
    status: result.status ?? 1,
    signal: result.signal ?? null,
  };
}

const candidates = isWindows ? buildWindowsCandidates() : buildUnixCandidates();
const attempted = [];

for (const candidate of candidates) {
  if (!canAttempt(candidate)) {
    continue;
  }

  attempted.push(candidate.label);
  const result = tryCandidate(candidate);

  if (!result.launched) {
    continue;
  }

  if (result.signal) {
    process.kill(process.pid, result.signal);
  }

  process.exit(result.status);
}

const attemptedSummary =
  attempted.length > 0 ? attempted.join(", ") : "no viable Codex CLI entrypoints";

console.error("Unable to launch the Codex CLI.");
console.error(`Tried: ${attemptedSummary}`);
console.error(
  "If Codex is installed but the global shim is broken, set CODEX_CLI_BIN to a working codex executable or cmd path.",
);
process.exit(1);
