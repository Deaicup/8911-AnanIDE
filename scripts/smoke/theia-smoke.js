const http = require('http');
const { spawn, spawnSync } = require('child_process');

const url = 'http://127.0.0.1:3000';
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const spawnCommand = isWindows ? process.env.ComSpec || 'cmd.exe' : npmCommand;
const spawnArgs = isWindows
  ? ['/d', '/s', '/c', `${npmCommand} run start -w @anan/theia-app`]
  : ['run', 'start', '-w', '@anan/theia-app'];

function requestText(target) {
  return new Promise((resolve, reject) => {
    const req = http.get(target, res => {
      let data = '';
      res.setEncoding('utf-8');
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode || 0, data });
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy(new Error('request timeout'));
    });
  });
}

async function waitForServer(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await requestText(url);
      if (response.statusCode >= 200 && response.statusCode < 500) {
        return response;
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Theia did not respond at ${url} within ${timeoutMs}ms`);
}

async function main() {
  const child = spawn(spawnCommand, spawnArgs, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let stderr = '';
  let spawnError;
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });
  child.on('error', error => {
    spawnError = error;
  });

  try {
    const response = await Promise.race([
      waitForServer(90000),
      waitForSpawnFailure(child, () => spawnError),
    ]);
    if (!response.data.includes('bundle.js') && !response.data.includes('8911')) {
      throw new Error('Theia responded but did not look like the expected frontend HTML.');
    }
    console.log('Theia HTTP smoke check passed.');
  } finally {
    stopChild(child);
  }

  if (child.exitCode && child.exitCode !== 0) {
    throw new Error(stderr || `Theia exited with code ${child.exitCode}`);
  }
}

function waitForSpawnFailure(child, getSpawnError) {
  return new Promise((_, reject) => {
    child.once('error', error => reject(error));
    child.once('exit', code => {
      const spawnError = getSpawnError();
      if (spawnError) {
        reject(spawnError);
      } else if (code && code !== 0) {
        reject(new Error(`Theia exited early with code ${code}`));
      }
    });
  });
}

function stopChild(child) {
  if (isWindows && child.pid) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    child.stdout.destroy();
    child.stderr.destroy();
    child.unref();
    return;
  }

  child.kill();
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
  }, 2000).unref();
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
