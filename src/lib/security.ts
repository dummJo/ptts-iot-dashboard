import crypto from 'crypto';

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
};

function getSecret(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} environment variable is required`);
  return val;
}

const MASTER_KEY_SECRET = getSecret('MASTER_KEY_SECRET');
const ENCRYPTION_SALT = getSecret('AUTH_SALT');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    if (stored.includes(':')) {
      const [salt, hash] = stored.split(':');
      const newHash = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
    }

    // Legacy SHA256 fallback (64 hex chars = 32 bytes)
    if (stored.length === 64) {
      const sha256Hash = crypto.createHash("sha256").update(password).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(sha256Hash, 'hex'));
    }
  } catch (err) {
    console.error("verifyPassword error:", err);
  }
  return false;
}

/**
 * Encrypts sensitive data using AES-256-GCM.
 * The key is derived from a master secret using Scrypt.
 * @param text Data to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export function encryptData(text: string): string {
  const iv = crypto.randomBytes(16);
  // Derive a 32-byte key for AES-256
  const key = crypto.scryptSync(MASTER_KEY_SECRET, ENCRYPTION_SALT, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data encrypted with encryptData.
 * @param encryptedText The iv:authTag:encryptedData string
 * @returns Decrypted plain text
 */
export function decryptData(encryptedText: string): string {
  try {
    const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(MASTER_KEY_SECRET, ENCRYPTION_SALT, 32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err);
    return "";
  }
}
