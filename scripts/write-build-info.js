const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readGitValue(args) {
  try {
    return require('child_process').execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function safeWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const commit = process.env.GITHUB_SHA || readGitValue(['rev-parse', 'HEAD']) || 'unknown';
const shortCommit = commit === 'unknown' ? 'unknown' : commit.slice(0, 12);
const branch = process.env.GITHUB_REF_NAME || readGitValue(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown';
const buildId = process.env.GITHUB_RUN_ID || process.env.BUILD_ID || `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
const builtAt = new Date().toISOString();

const info = {
  app: 'ehsansalehi.ir',
  environment: process.env.NODE_ENV || 'production',
  buildId,
  builtAt,
  commit,
  shortCommit,
  branch,
  actor: process.env.GITHUB_ACTOR || process.env.USER || 'unknown',
  workflow: process.env.GITHUB_WORKFLOW || null,
  runNumber: process.env.GITHUB_RUN_NUMBER || null,
  runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
  node: process.version,
};

const targets = [path.join(process.cwd(), 'public', 'deploy-info.json')];
const standaloneDir = path.join(process.cwd(), '.next', 'standalone');
if (fs.existsSync(standaloneDir)) {
  targets.push(path.join(standaloneDir, 'deploy-info.json'));
}

for (const target of targets) {
  safeWriteJson(target, info);
  console.log(`[write-build-info] wrote ${target}`);
}
