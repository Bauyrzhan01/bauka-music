const fs = require('fs');
const path = require('path');
const { getLanIpv4Addresses } = require('./lan-address');

const API_PORT = 3001;
const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function readEnvApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  if (!fs.existsSync(ENV_PATH)) return null;

  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const match = content.match(/^EXPO_PUBLIC_API_URL=(.+)$/m);
  if (!match) return null;

  const value = match[1].trim().replace(/^["']|["']$/g, '');
  return value ? value.replace(/\/$/, '') : null;
}

function resolveBuildApiUrl() {
  const fromEnv = readEnvApiUrl();
  if (fromEnv) return fromEnv;

  const ips = getLanIpv4Addresses();
  if (ips[0]) {
    return `http://${ips[0]}:${API_PORT}`;
  }

  return null;
}

function ensureEnvApiUrl(url) {
  const line = `EXPO_PUBLIC_API_URL=${url}`;
  let content = '';

  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf8');
    if (/^EXPO_PUBLIC_API_URL=/m.test(content)) {
      content = content.replace(/^EXPO_PUBLIC_API_URL=.*$/m, line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
  } else {
    content = `${line}\n`;
  }

  fs.writeFileSync(ENV_PATH, content, 'utf8');
}

module.exports = {
  API_PORT,
  resolveBuildApiUrl,
  ensureEnvApiUrl,
};
