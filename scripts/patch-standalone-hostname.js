const fs = require('fs');
const path = require('path');

const serverFile = path.join(process.cwd(), '.next', 'standalone', 'server.js');

if (!fs.existsSync(serverFile)) {
  console.warn(`[patch-standalone-hostname] ${serverFile} not found; skipping.`);
  process.exit(0);
}

const before = fs.readFileSync(serverFile, 'utf8');
let after = before;

const replacements = [
  [/const hostname = process\.env\.HOSTNAME \|\| ['"]0\.0\.0\.0['"]/g, "const hostname = '0.0.0.0'"],
  [/hostname:\s*process\.env\.HOSTNAME \|\| ['"]0\.0\.0\.0['"]/g, "hostname: '0.0.0.0'"],
];

for (const [pattern, replacement] of replacements) {
  after = after.replace(pattern, replacement);
}

if (after === before) {
  console.warn('[patch-standalone-hostname] No HOSTNAME binding pattern found; generated server.js may have changed.');
  const lines = before.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes('HOSTNAME') || lines[i].includes('hostname')) {
      console.warn(`${i + 1}: ${lines[i]}`);
    }
  }
  process.exit(0);
}

fs.writeFileSync(serverFile, after);
console.log('[patch-standalone-hostname] Forced standalone server hostname to 0.0.0.0 for cPanel Passenger.');
