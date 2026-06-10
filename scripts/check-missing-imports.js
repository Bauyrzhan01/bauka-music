const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = /node_modules|android|\.expo|server[/\\]|scripts[/\\]check-missing-imports|api[/\\]/;

const HELPERS = [
  'useMyLibrary',
  'useAuth',
  'usePlayer',
  'useFavorites',
  'useOffline',
  'useMusicCatalog',
  'useAlbums',
  'useAppPreferences',
  'useReelsNav',
  'isStandaloneApp',
  'collectLocalReels',
  'getApiBaseUrl',
  'ensureApiBaseOverrideLoaded',
  'filterMyReels',
  'resolveTrackForVersion',
  'displayContentTitle',
  'loadRecentTrackIds',
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function getImportNames(src) {
  const names = new Set();
  for (const m of src.matchAll(/import\s+([^;]+?)\s+from\s+['"][^'"]+['"]/g)) {
    const clause = m[1].trim();
    if (clause.startsWith('{')) {
      clause
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((part) => {
          const bits = part.split(/\s+as\s+/);
          names.add(bits[bits.length - 1].trim());
        });
    } else if (clause.startsWith('* as ')) {
      names.add(clause.replace('* as ', '').trim());
    } else {
      names.add(clause.split(',')[0].trim());
    }
  }
  return names;
}

const issues = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (SKIP.test(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const imports = getImportNames(src);
  for (const helper of HELPERS) {
    if (!src.includes(`${helper}(`)) continue;
    const declared =
      imports.has(helper) ||
      src.includes(`function ${helper}`) ||
      src.includes(`const ${helper} =`) ||
      src.includes(`export function ${helper}`);
    if (!declared) issues.push(`${rel}: missing import for ${helper}`);
  }
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('[ok] No missing helper/hook imports in app code');
