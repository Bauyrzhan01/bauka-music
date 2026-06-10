const fs = require('fs');
const path = require('path');

const TRANSCRIPT = path.join(
  process.env.USERPROFILE,
  '.cursor',
  'projects',
  'c-Users-bauka-OneDrive-Desktop-Bauka-Music',
  'agent-transcripts',
  '3da5e1f9-d27e-4e1b-8c8f-c9f3affe96b3',
  '3da5e1f9-d27e-4e1b-8c8f-c9f3affe96b3.jsonl'
);

const TARGET = path.join('C:', 'Projects', 'Bauka Music');

function remapPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/bauka music\/(.+)$/i);
  if (!match) return null;
  return path.join(TARGET, match[1].replace(/\//g, path.sep));
}

function applyStrReplace(content, oldString, newString, replaceAll) {
  if (!content.includes(oldString)) {
    return null;
  }
  if (replaceAll) {
    return content.split(oldString).join(newString);
  }
  return content.replace(oldString, newString);
}

function main() {
  if (!fs.existsSync(TRANSCRIPT)) {
    console.error('[restore] Transcript not found:', TRANSCRIPT);
    process.exit(1);
  }

  fs.mkdirSync(TARGET, { recursive: true });

  const lines = fs.readFileSync(TRANSCRIPT, 'utf8').split('\n').filter(Boolean);
  let writes = 0;
  let replaces = 0;
  let replaceSkipped = 0;

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    const parts = row?.message?.content;
    if (!Array.isArray(parts)) continue;

    for (const part of parts) {
      if (part.type !== 'tool_use') continue;
      const { name, input } = part;
      if (!input?.path) continue;

      const outPath = remapPath(input.path);
      if (!outPath) continue;
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      if (name === 'Write' && typeof input.contents === 'string') {
        fs.writeFileSync(outPath, input.contents, 'utf8');
        writes += 1;
      } else if (name === 'StrReplace') {
        if (!fs.existsSync(outPath)) {
          replaceSkipped += 1;
          continue;
        }
        const current = fs.readFileSync(outPath, 'utf8');
        const next = applyStrReplace(
          current,
          input.old_string,
          input.new_string,
          Boolean(input.replace_all)
        );
        if (next === null) {
          replaceSkipped += 1;
          continue;
        }
        fs.writeFileSync(outPath, next, 'utf8');
        replaces += 1;
      }
    }
  }

  console.log('[restore] Target:', TARGET);
  console.log('[restore] Write:', writes);
  console.log('[restore] StrReplace:', replaces);
  console.log('[restore] StrReplace skipped:', replaceSkipped);

  const pkg = path.join(TARGET, 'package.json');
  if (!fs.existsSync(pkg)) {
    console.error('[restore] package.json missing — base project not restored.');
    process.exit(1);
  }

  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(full);
      } else {
        files.push(full);
      }
    }
  }
  walk(TARGET);
  console.log('[restore] Files restored:', files.length);
}

main();
