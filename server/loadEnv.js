const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

function loadEnv() {
  try {
    require('dotenv').config({ path: ENV_PATH });
    return;
  } catch {
    // dotenv optional
  }

  if (!fs.existsSync(ENV_PATH)) return;

  const text = fs.readFileSync(ENV_PATH, 'utf8');
  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnv();

module.exports = { loadEnv };
