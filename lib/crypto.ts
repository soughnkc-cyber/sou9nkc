import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Access environment variables securely
const SECRET = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-me-123';
// Derive a 32-byte key from the secret
const key = crypto.createHash('sha256').update(String(SECRET)).digest();

export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return text;
  try {
      const textParts = text.split(':');
      const ivHex = textParts.shift();
      if (!ivHex) return text;
      const iv = Buffer.from(ivHex, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
  } catch (error) {
      console.error("Decryption error:", error);
      return "";
  }
}
