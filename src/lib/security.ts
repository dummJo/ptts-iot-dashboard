import crypto from 'crypto';

/**
 * Industrial-grade Security Utility
 * Uses Scrypt for password hashing and AES-256-GCM for data encryption.
 */

const SCRYPT_PARAMS = {
  N: 16384, // Cost factor (2^14)
  r: 8,     // Block size
  p: 1,     // Parallelization factor
};

const SALT = process.env.AUTH_SALT || "ptts-salt-2024";
const MASTER_KEY_SECRET = process.env.MASTER_KEY_SECRET || "ptts-master-security-key-2024";

/**
 * Hashes a password using Scrypt with industrial parameters.
 * @param password The plain text password
 * @returns Hex string of the hash
 */
export function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 64, SCRYPT_PARAMS).toString('hex');
}

/**
 * Verifies a password against a hash.
 * @param password The plain text password
 * @param hash The stored hash
 * @returns Boolean indicating match
 */
export function verifyPassword(password: string, hash: string): boolean {
  const newHash = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(newHash, 'hex'));
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
  const key = crypto.scryptSync(MASTER_KEY_SECRET, SALT, 32);
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
    const key = crypto.scryptSync(MASTER_KEY_SECRET, SALT, 32);
    
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
