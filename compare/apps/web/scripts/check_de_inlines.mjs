import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deInlinesPath = path.resolve(__dirname, '../locales/de_inlines.json');
if (!fs.existsSync(deInlinesPath)) {
  console.error('❌ de_inlines.json not found at:', deInlinesPath);
  process.exit(1);
}

const deInlines = JSON.parse(fs.readFileSync(deInlinesPath, 'utf8'));

const files = [
  'components/equivalence/EquivalenceCalculatorClient.tsx',
  'components/compare/CompareClient.tsx',
  'components/wizard/Step7Results.tsx',
  'components/wizard/Step3Income.tsx',
  'components/percentile/PercentileClient.tsx',
  'components/contribute/ContributeClient.tsx',
  'components/wizard/Step4Housing.tsx',
  'components/wizard/Step5Lifestyle.tsx',
  'components/wizard/Step1Destination.tsx',
  'components/wizard/Step6Review.tsx',
  'components/common/PriceCorrectionModal.tsx',
  'components/share/SharedScenarioClient.tsx'
];

function parseTxtCalls(src) {
  const calls = [];
  let idx = 0;
  while (true) {
    const pos = src.indexOf('txt(', idx);
    if (pos === -1) break;
    let pCount = 1;
    let end = pos + 4;
    let inStr = null;
    let esc = false;
    while (end < src.length && pCount > 0) {
      const ch = src[end];
      if (esc) {
        esc = false;
      } else if (ch === '\\') {
        esc = true;
      } else if (inStr) {
        if (ch === inStr) inStr = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inStr = ch;
      } else if (ch === '(') {
        pCount++;
      } else if (ch === ')') {
        pCount--;
      }
      end++;
    }

    const argStr = src.slice(pos + 4, end - 1);
    calls.push({ pos, argStr });
    idx = pos + 4;
  }

  const threeArgs = [];
  const fourArgs = [];

  for (const { pos, argStr } of calls) {
    const args = [];
    let cur = [];
    let inS = null;
    let esc = false;
    let pLvl = 0;
    for (let i = 0; i < argStr.length; i++) {
      const ch = argStr[i];
      if (esc) {
        esc = false;
        cur.push(ch);
      } else if (ch === '\\') {
        esc = true;
        cur.push(ch);
      } else if (inS) {
        cur.push(ch);
        if (ch === inS) inS = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inS = ch;
        cur.push(ch);
      } else if (ch === '(' || ch === '[' || ch === '{') {
        pLvl++;
        cur.push(ch);
      } else if (ch === ')' || ch === ']' || ch === '}') {
        pLvl--;
        cur.push(ch);
      } else if (ch === ',' && pLvl === 0 && !inS) {
        args.push(cur.join('').trim());
        cur = [];
      } else {
        cur.push(ch);
      }
    }
    if (cur.length > 0) {
      args.push(cur.join('').trim());
    }

    if (args.length === 3) {
      threeArgs.push({ pos, args });
    } else if (args.length === 4) {
      fourArgs.push({ pos, args });
    }
  }

  return { threeArgs, fourArgs };
}

let total3Args = 0;
let total4Args = 0;
const missingInlines = [];
const illegalTemplates = [];

for (const relPath of files) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn('⚠️ File not found:', fullPath);
    continue;
  }
  const src = fs.readFileSync(fullPath, 'utf8');
  const { threeArgs, fourArgs } = parseTxtCalls(src);
  total3Args += threeArgs.length;
  total4Args += fourArgs.length;

  for (const { pos, args } of threeArgs) {
    const idArg = args[0];
    const line = src.slice(0, pos).split('\n').length;
    if (idArg.startsWith('`')) {
      illegalTemplates.push({ file: relPath, line, arg: idArg });
    } else if ((idArg.startsWith('"') && idArg.endsWith('"')) || (idArg.startsWith("'") && idArg.endsWith("'"))) {
      const literalVal = idArg.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
      if (deInlines[literalVal] === undefined) {
        missingInlines.push({ file: relPath, line, key: literalVal });
      }
    }
  }
}

// Also check required dynamic keys
const requiredDynamic = ['Lajang', 'Menikah (0 Anak)', 'Keluarga 1 Anak', 'Keluarga 2 Anak'];
for (const dyn of requiredDynamic) {
  if (deInlines[dyn] === undefined) {
    missingInlines.push({ file: 'dynamic', line: 0, key: dyn });
  }
}

console.log('--- i18n Inline German Coverage Audit ---');
console.log(`✓ 3-arg calls audited: ${total3Args}`);
console.log(`✓ 4-arg calls audited: ${total4Args}`);
console.log(`✓ Unique dictionary keys in de_inlines.json: ${Object.keys(deInlines).length}`);

let hasErrors = false;

if (illegalTemplates.length > 0) {
  hasErrors = true;
  console.error(`❌ Found ${illegalTemplates.length} 3-arg template literals (must be 4-arg with explicit German):`);
  for (const item of illegalTemplates) {
    console.error(`  - ${item.file}:${item.line}: ${item.arg}`);
  }
} else {
  console.log('✓ 0 illegal 3-arg template literals found.');
}

if (missingInlines.length > 0) {
  hasErrors = true;
  console.error(`❌ Missing ${missingInlines.length} inline translations in de_inlines.json:`);
  for (const item of missingInlines) {
    console.error(`  - [${item.file}:${item.line}] "${item.key}"`);
  }
} else {
  console.log('✓ 100% coverage in de_inlines.json! Zero missing entries.');
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('✅ PASS: All inline calls verified successfully.');
  process.exit(0);
}
