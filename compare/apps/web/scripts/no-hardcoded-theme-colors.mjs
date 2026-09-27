import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const scanDirs = ['app', 'components'];
const exemptFiles = [
  'app/opengraph-image.tsx',
  'scripts/no-hardcoded-theme-colors.mjs',
];

// Patterns that MUST NOT appear
const forbiddenPatterns = [
  { name: 'white opacity background', regex: /\bbg-white\/\d+/ },
  { name: 'white opacity border', regex: /\bborder-white\/\d+/ },
  { name: 'white opacity ring', regex: /\bring-white\/\d+/ },
  { name: 'white opacity divide', regex: /\bdivide-white\/\d+/ },
  { name: 'white opacity text', regex: /\btext-white\/\d+/ },
  { name: 'deprecated brand-* green scale', regex: /\bbrand-[a-zA-Z0-9\/-]+/ },
  {
    name: 'hardcoded theme hex',
    regex: /#(?:14b8a6|ffa528|28906d|47ac87|1e293b|0e1a16|0c1512)\b/i,
  },
];

let errors = [];

function checkFile(filePath) {
  const relPath = path.relative(webRoot, filePath).replace(/\\/g, '/');
  if (exemptFiles.includes(relPath)) return;
  if (!/\.(tsx|ts|jsx|js)$/.test(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // 1. Check all forbidden patterns
    for (const pat of forbiddenPatterns) {
      if (pat.regex.test(line)) {
        errors.push({
          file: relPath,
          line: idx + 1,
          rule: pat.name,
          text: line.trim(),
        });
      }
    }

    // 2. Check un-scoped text-white (not on an accent/filled button)
    if (/\btext-white\b/.test(line)) {
      const isAllowedButton =
        /bg-\[(?:var\(--accent\)|#0a66c2|#25D366)\]|btn-primary|btn-accent/.test(line);
      if (!isAllowedButton) {
        errors.push({
          file: relPath,
          line: idx + 1,
          rule: 'unscoped text-white (must use text-fg or text-[var(--text)])',
          text: line.trim(),
        });
      }
    }
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile()) {
      checkFile(full);
    }
  }
}

for (const d of scanDirs) {
  const dirPath = path.join(webRoot, d);
  if (fs.existsSync(dirPath)) {
    walk(dirPath);
  }
}

if (errors.length > 0) {
  console.error(`\x1b[31m[check:theme] Failed with ${errors.length} violations:\x1b[0m\n`);
  errors.forEach((e) => {
    console.error(`  ${e.file}:${e.line} [${e.rule}] -> ${e.text.substring(0, 100)}`);
  });
  process.exit(1);
} else {
  console.log('\x1b[32m[check:theme] Passed! Zero hardcoded white/brand/hex theme violations found.\x1b[0m');
  process.exit(0);
}
