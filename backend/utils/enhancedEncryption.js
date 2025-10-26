import crypto from 'crypto';

// Enhanced encryption with proper key management
class EnhancedEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm'; // More secure than CBC
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.saltLength = 64; // 512 bits
    
    // Validate environment variables
    this.validateEnvironment();
  }

  validateEnvironment() {
    const requiredEnvVars = [
      'ENCRYPTION_SECRET',
      'JWT_SECRET',
      'BACKUP_ENCRYPTION_KEY'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Debug environment variables
    console.log('🔧 Environment Debug:', {
      ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET?.substring(0, 10) + '...',
      JWT_SECRET: process.env.JWT_SECRET?.substring(0, 10) + '...',
      BACKUP_ENCRYPTION_KEY: process.env.BACKUP_ENCRYPTION_KEY?.substring(0, 10) + '...',
      NODE_ENV: process.env.NODE_ENV
    });

    // Validate key strength (only in production)
    if (process.env.NODE_ENV === 'production') {
      if (process.env.ENCRYPTION_SECRET.length < 32) {
        throw new Error('ENCRYPTION_SECRET must be at least 32 characters long');
      }

      if (process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
      }

      if (process.env.BACKUP_ENCRYPTION_KEY.length < 64) {
        throw new Error('BACKUP_ENCRYPTION_KEY must be at least 64 characters long');
      }
    } else {
      // In development, provide warnings but don't throw errors
      if (process.env.ENCRYPTION_SECRET.length < 32) {
        console.warn('⚠️ ENCRYPTION_SECRET is shorter than recommended (32 chars minimum)');
      }

      if (process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️ JWT_SECRET is shorter than recommended (32 chars minimum)');
      }

      if (process.env.BACKUP_ENCRYPTION_KEY.length < 64) {
        console.warn('⚠️ BACKUP_ENCRYPTION_KEY is shorter than recommended (64 chars minimum)');
      }
    }
  }

  // Generate a cryptographically secure random key
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // Derive key from password using PBKDF2
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha512');
  }

  // Encrypt data with authenticated encryption
  encrypt(data, key = null) {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_SECRET;
      const salt = crypto.randomBytes(this.saltLength);
      const derivedKey = this.deriveKey(encryptionKey, salt);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.algorithm
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with authentication
  decrypt(encryptedData, key = null) {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_SECRET;
      const { encrypted, iv, salt, tag, algorithm } = encryptedData;
      
      if (algorithm !== this.algorithm) {
        throw new Error('Unsupported encryption algorithm');
      }
      
      const derivedKey = this.deriveKey(encryptionKey, Buffer.from(salt, 'hex'));
      const decipher = crypto.createDecipheriv(algorithm, derivedKey, Buffer.from(iv, 'hex'));
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data (one-way)
  hash(data, salt = null) {
    const dataSalt = salt || crypto.randomBytes(32);
    const hash = crypto.pbkdf2Sync(data, dataSalt, 100000, 64, 'sha512');
    return {
      hash: hash.toString('hex'),
      salt: dataSalt.toString('hex')
    };
  }

  // Verify hash
  verify(data, hash, salt) {
    const dataHash = this.hash(data, Buffer.from(salt, 'hex'));
    return crypto.timingSafeEqual(
      Buffer.from(dataHash.hash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  // Generate secure random string
  generateSecureString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt file buffer
  encryptFile(buffer) {
    const salt = crypto.randomBytes(this.saltLength);
    const derivedKey = this.deriveKey(process.env.ENCRYPTION_SECRET, salt);
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt file buffer
  decryptFile(encryptedData) {
    const { encrypted, iv, salt, tag } = encryptedData;
    const derivedKey = this.deriveKey(process.env.ENCRYPTION_SECRET, Buffer.from(salt, 'hex'));
    const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, Buffer.from(iv, 'hex'));
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }
}

// Create singleton instance
const enhancedEncryption = new EnhancedEncryption();

export default enhancedEncryption;
export const { encrypt, decrypt, hash, verify, generateSecureString, encryptFile, decryptFile } = enhancedEncryption;
