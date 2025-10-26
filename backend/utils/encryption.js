// utils/encryption.js
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_SECRET || 'your-32-byte-secret-key-here-123456';
const iv = crypto.randomBytes(16);

export const encryptData = (data) => {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'utf-8'), iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    content: encrypted
  };
};

export const decryptData = ({ iv, content }) => {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'utf-8'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};
