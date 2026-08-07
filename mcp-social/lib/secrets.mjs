import crypto from 'node:crypto';

const RAW_KEY = process.env.MCP_SECRET_ENCRYPTION_KEY || '';
const ACTIVE_KEY = RAW_KEY ? crypto.createHash('sha256').update(RAW_KEY).digest() : null;

export function secretEncryptionEnabled() {
  return Boolean(ACTIVE_KEY);
}

export function serializeSecretPayload(payload) {
  const cleanPayload = Object.fromEntries(
    Object.entries(payload || {}).filter(([, value]) => value !== undefined)
  );

  if (!ACTIVE_KEY) {
    return JSON.stringify({ v: 1, alg: 'plain', data: cleanPayload });
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ACTIVE_KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(cleanPayload), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64url'),
    tag: tag.toString('base64url'),
    data: ciphertext.toString('base64url'),
  });
}

export function deserializeSecretPayload(raw) {
  if (!raw) return {};

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (!parsed || typeof parsed !== 'object') return {};

  if (parsed.alg === 'plain') {
    return parsed.data && typeof parsed.data === 'object' ? parsed.data : {};
  }

  if (parsed.alg === 'aes-256-gcm') {
    if (!ACTIVE_KEY) {
      throw new Error('MCP_SECRET_ENCRYPTION_KEY is required to decrypt stored secrets');
    }
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ACTIVE_KEY,
      Buffer.from(parsed.iv, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(parsed.data, 'base64url')),
      decipher.final(),
    ]);
    const value = JSON.parse(plaintext.toString('utf8'));
    return value && typeof value === 'object' ? value : {};
  }

  return {};
}
