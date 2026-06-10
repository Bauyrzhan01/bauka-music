const fs = require('fs');
const path = require('path');

const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'server' || entry.name === '.git') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.js')) {
      files.push(full);
    }
  }
}

walk('.');

const hooks = /\b(useState|useEffect|useCallback|useMemo|useRef|useContext)\s*\(/;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!hooks.test(text)) continue;
  if (!/from ['"]react['"]/.test(text)) {
    console.log('NO REACT IMPORT:', file);
  }
}
