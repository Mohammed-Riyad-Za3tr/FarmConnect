const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const requirementsFile = path.join(appRoot, 'requirements.txt');
const localVenvDir = path.join(appRoot, '.venv');
const localVenvPython = path.join(
  localVenvDir,
  process.platform === 'win32' ? 'Scripts' : 'bin',
  process.platform === 'win32' ? 'python.exe' : 'python3',
);

const candidates = [
  { cmd: process.env.FARMCONNECT_PYTHON, preArgs: [] },
  { cmd: path.join(appRoot, '.venv', 'Scripts', 'python.exe'), preArgs: [] },
  { cmd: path.join(appRoot, '.venv', 'bin', 'python3'), preArgs: [] },
  { cmd: 'python3', preArgs: [] },
  { cmd: 'python', preArgs: [] },
  { cmd: 'py', preArgs: ['-3'] },
].filter((item) => Boolean(item.cmd));

function isPathLike(value) {
  return value.includes(path.sep) || value.includes('/') || value.includes('\\\\');
}

function canUse(candidate) {
  if (!candidate.cmd) return false;
  if (isPathLike(candidate.cmd)) {
    return fs.existsSync(candidate.cmd);
  }

  const result = spawnSync(candidate.cmd, [...candidate.preArgs, '--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });

  return result.status === 0;
}

function hasRequiredPackages(pythonExecutable) {
  const result = spawnSync(
    pythonExecutable,
    [
      '-c',
      [
        'import fastapi',
        'import httpx',
        'import pydantic',
        'import pydantic_settings',
        'import pytest',
        'import pytest_asyncio',
        'import structlog',
        'import uvicorn',
      ].join('; '),
    ],
    {
      stdio: 'ignore',
      shell: process.platform === 'win32' && !isPathLike(pythonExecutable),
    },
  );

  return result.status === 0;
}

function runPython(pythonExecutable, args, options = {}) {
  return spawnSync(pythonExecutable, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32' && !isPathLike(pythonExecutable),
    ...options,
  });
}

function ensurePythonEnvironment() {
  if (!fs.existsSync(requirementsFile)) {
    return;
  }

  if (fs.existsSync(localVenvPython) && hasRequiredPackages(localVenvPython)) {
    return;
  }

  const bootstrap = candidates.find((candidate) => candidate.cmd && candidate.cmd !== localVenvPython && canUse(candidate));

  if (!bootstrap) {
    return;
  }

  if (!fs.existsSync(localVenvPython)) {
    const createResult = runPython(bootstrap.cmd, [...bootstrap.preArgs, '-m', 'venv', localVenvDir]);
    if (createResult.status !== 0) {
      process.exit(createResult.status ?? 1);
    }
  }

  if (!hasRequiredPackages(localVenvPython)) {
    const installResult = runPython(localVenvPython, ['-m', 'pip', 'install', '--disable-pip-version-check', '-r', requirementsFile]);
    if (installResult.status !== 0) {
      process.exit(installResult.status ?? 1);
    }
  }
}

ensurePythonEnvironment();

const selected = candidates.find(canUse);

if (!selected) {
  console.error('No usable Python executable found. Set FARMCONNECT_PYTHON or create a .venv.');
  process.exit(1);
}

const args = [...selected.preArgs, ...process.argv.slice(2)];
const result = spawnSync(selected.cmd, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32' && !isPathLike(selected.cmd),
});

process.exit(result.status ?? 1);
