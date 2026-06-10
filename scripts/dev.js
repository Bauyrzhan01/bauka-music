/**
 * API в фоне с префиксом [api], Expo в foreground с inherit stdio —
 * иначе concurrently ломает QR-код (префиксы на каждой строке + не-TTY).
 */
const { spawn } = require('child_process');
const path = require('path');
const { printDevUrls } = require('./print-dev-urls');

const root = path.join(__dirname, '..');
const isWindows = process.platform === 'win32';
const useTunnel = process.argv.includes('--tunnel');
const useClear = process.argv.includes('--clear');
const useWeb = process.argv.includes('--web');

function prefixStream(stream, name, isErr = false) {
  const out = isErr ? process.stderr : process.stdout;
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    lines.forEach((line) => {
      if (line.length === 0) return;
      out.write(`[${name}] ${line}\n`);
    });
  });

  stream.on('end', () => {
    if (buffer.trim()) {
      out.write(`[${name}] ${buffer}\n`);
    }
  });
}

function startApi() {
  const child = spawn('node', ['scripts/start-server.js'], {
    cwd: root,
    shell: false,
    env: process.env,
  });

  if (child.stdout) prefixStream(child.stdout, 'api');
  if (child.stderr) prefixStream(child.stderr, 'api', true);

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[api] завершился с кодом ${code}`);
      shutdown(1);
    }
  });

  return child;
}

function startExpo() {
  const args = ['expo', 'start', '--host', 'lan'];
  if (useClear) args.push('--clear');
  if (useTunnel) args.push('--tunnel');
  if (useWeb) args.push('--web');

  printDevUrls();
  if (useTunnel) {
    console.log('[expo] Режим tunnel — QR работает даже в другой сети (медленнее)\n');
  }

  const child = spawn('npx', args, {
    cwd: root,
    shell: isWindows,
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'false',
      FORCE_COLOR: '1',
    },
  });

  child.on('exit', (code) => {
    shutdown(code ?? 0);
  });

  return child;
}

let apiProcess = null;
let expoProcess = null;
let exiting = false;

function shutdown(code = 0) {
  if (exiting) return;
  exiting = true;

  if (apiProcess && !apiProcess.killed) {
    apiProcess.kill();
  }
  if (expoProcess && !expoProcess.killed) {
    expoProcess.kill();
  }

  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

apiProcess = startApi();
setTimeout(() => {
  expoProcess = startExpo();
}, 400);
