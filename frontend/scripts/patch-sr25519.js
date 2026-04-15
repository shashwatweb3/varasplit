const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const files = [
  'node_modules/@scure/sr25519/index.ts',
  'node_modules/@scure/sr25519/lib/index.js',
  'node_modules/@scure/sr25519/lib/esm/index.js',
];
const bad = "`proving${'\\0'}0`";
const good = "'proving' + String.fromCharCode(0) + '0'";
let patched = 0;

for (const relativePath of files) {
  const filePath = path.join(packageRoot, relativePath);
  if (!fs.existsSync(filePath)) continue;

  const source = fs.readFileSync(filePath, 'utf8');
  if (!source.includes(bad)) continue;

  fs.writeFileSync(filePath, source.replaceAll(bad, good));
  patched += 1;
}

if (patched > 0) {
  console.log(`[patch-sr25519] Patched ${patched} file${patched === 1 ? '' : 's'}.`);
} else {
  console.log('[patch-sr25519] No patch needed.');
}
