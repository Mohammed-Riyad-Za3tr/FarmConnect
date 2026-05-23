const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const candidates = [
  { cmd: process.env.FARMCONNECT_PYTHON, preArgs: [] },
  { cmd: path.join(repoRoot, '.venv', 'Scripts', 'python.exe'), preArgs: [] },
  { cmd: path.join(repoRoot, '.venv', 'bin', 'python3'), preArgs: [] },
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
