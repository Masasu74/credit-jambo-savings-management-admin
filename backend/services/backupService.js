import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import mongoose from 'mongoose';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import enhancedEncryption from '../utils/enhancedEncryption.js';
import { logActivity } from '../utils/logActivity.js';

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || enhancedEncryption.generateBackupKey();
    
    // AWS S3 configuration for cloud backups
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.bucketName = process.env.AWS_BACKUP_BUCKET || 'anchor-finance-backups';
    
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create full database backup
   */
  async createFullBackup(userId = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `full-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // Database backup
      const dbBackup = await this.backupDatabase(backupPath);
      
      // File system backup
      const filesBackup = await this.backupFiles(backupPath);
      
      // Configuration backup
      const configBackup = await this.backupConfiguration(backupPath);
      
      // Create backup manifest
      const manifest = {
        backupId: backupName,
        timestamp: new Date().toISOString(),
        type: 'full',
        database: dbBackup,
        files: filesBackup,
        configuration: configBackup,
        encryption: {
          algorithm: 'aes-256-gcm',
          keyHash: enhancedEncryption.generateSecureString(16)
        },
        checksum: await this.generateChecksum(backupPath)
      };

      // Save manifest
      await fs.writeFile(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Encrypt backup
      const encryptedBackup = await this.encryptBackup(backupPath);
      
      // Upload to cloud storage
      if (process.env.ENABLE_CLOUD_BACKUP === 'true') {
        await this.uploadToCloud(encryptedBackup, backupName);
      }

      // Log backup creation
      if (userId) {
        await logActivity({
          user: userId,
          action: 'backup_created',
          entityType: 'Backup',
          entityId: backupName,
          details: {
            type: 'full',
            size: await this.getDirectorySize(backupPath),
            location: process.env.ENABLE_CLOUD_BACKUP === 'true' ? 'cloud' : 'local'
          }
        });
      }

      console.log(`✅ Full backup created: ${backupName}`);
      return {
        success: true,
        backupId: backupName,
        path: backupPath,
        size: await this.getDirectorySize(backupPath)
      };

    } catch (error) {
      console.error('❌ Full backup failed:', error);
      throw error;
    }
  }

  /**
   * Create incremental backup
   */
  async createIncrementalBackup(lastBackupId, userId = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `incremental-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);
      
      await fs.mkdir(backupPath, { recursive: true });

      // Get changes since last backup
      const changes = await this.getChangesSinceLastBackup(lastBackupId);
      
      // Backup only changed data
      const incrementalData = await this.backupIncrementalData(changes, backupPath);
      
      const manifest = {
        backupId: backupName,
        timestamp: new Date().toISOString(),
        type: 'incremental',
        parentBackup: lastBackupId,
        changes: changes,
        data: incrementalData,
        checksum: await this.generateChecksum(backupPath)
      };

      await fs.writeFile(
        path.join(backupPath, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Encrypt and upload
      const encryptedBackup = await this.encryptBackup(backupPath);
      
      if (process.env.ENABLE_CLOUD_BACKUP === 'true') {
        await this.uploadToCloud(encryptedBackup, backupName);
      }

      if (userId) {
        await logActivity({
          user: userId,
          action: 'incremental_backup_created',
          entityType: 'Backup',
          entityId: backupName,
          details: {
            type: 'incremental',
            parentBackup: lastBackupId,
            changesCount: changes.length
          }
        });
      }

      console.log(`✅ Incremental backup created: ${backupName}`);
      return {
        success: true,
        backupId: backupName,
        path: backupPath,
        changesCount: changes.length
      };

    } catch (error) {
      console.error('❌ Incremental backup failed:', error);
      throw error;
    }
  }

  /**
   * Backup database
   */
  async backupDatabase(backupPath) {
    try {
      const dbName = process.env.MONGODB_DATABASE || 'anchorfinance';
      const dbBackupPath = path.join(backupPath, 'database');
      await fs.mkdir(dbBackupPath, { recursive: true });

      // MongoDB dump
      const dumpCommand = `mongodump --db ${dbName} --out ${dbBackupPath}`;
      await execAsync(dumpCommand);

      return {
        type: 'mongodb',
        path: dbBackupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Backup files
   */
  async backupFiles(backupPath) {
    try {
      const filesBackupPath = path.join(backupPath, 'files');
      await fs.mkdir(filesBackupPath, { recursive: true });

      // Backup uploads directory
      const uploadsDir = path.join(process.cwd(), 'uploads');
      try {
        await fs.access(uploadsDir);
        await this.copyDirectory(uploadsDir, path.join(filesBackupPath, 'uploads'));
      } catch {
        console.log('Uploads directory not found, skipping...');
      }

      // Backup logs
      const logsDir = path.join(process.cwd(), 'logs');
      try {
        await fs.access(logsDir);
        await this.copyDirectory(logsDir, path.join(filesBackupPath, 'logs'));
      } catch {
        console.log('Logs directory not found, skipping...');
      }

      return {
        type: 'files',
        path: filesBackupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Files backup failed:', error);
      throw error;
    }
  }

  /**
   * Backup configuration
   */
  async backupConfiguration(backupPath) {
    try {
      const configBackupPath = path.join(backupPath, 'config');
      await fs.mkdir(configBackupPath, { recursive: true });

      // Backup environment variables (without sensitive data)
      const envConfig = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        MONGODB_URI: process.env.MONGODB_URI ? '***REDACTED***' : undefined,
        JWT_SECRET: process.env.JWT_SECRET ? '***REDACTED***' : undefined,
        // Add other non-sensitive config
      };

      await fs.writeFile(
        path.join(configBackupPath, 'environment.json'),
        JSON.stringify(envConfig, null, 2)
      );

      // Backup system settings from database
      const SystemSettings = mongoose.model('SystemSettings');
      const settings = await SystemSettings.find({});
      
      await fs.writeFile(
        path.join(configBackupPath, 'system-settings.json'),
        JSON.stringify(settings, null, 2)
      );

      return {
        type: 'configuration',
        path: configBackupPath,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Configuration backup failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt backup directory
   */
  async encryptBackup(backupPath) {
    try {
      const encryptedPath = `${backupPath}-encrypted`;
      
      // Create tar archive
      const tarCommand = `tar -czf ${encryptedPath}.tar.gz -C ${backupPath} .`;
      await execAsync(tarCommand);

      // Read tar file
      const tarData = await fs.readFile(`${encryptedPath}.tar.gz`);
      
      // Encrypt tar file
      const encrypted = await enhancedEncryption.encryptFile(tarData, Buffer.from(this.encryptionKey, 'hex'));
      
      // Save encrypted file
      await fs.writeFile(`${encryptedPath}.enc`, encrypted.encrypted);
      
      // Save encryption metadata
      await fs.writeFile(`${encryptedPath}.meta`, JSON.stringify({
        iv: encrypted.iv,
        tag: encrypted.tag,
        algorithm: 'aes-256-gcm'
      }));

      // Clean up tar file
      await fs.unlink(`${encryptedPath}.tar.gz`);

      return {
        encryptedPath: `${encryptedPath}.enc`,
        metadataPath: `${encryptedPath}.meta`
      };
    } catch (error) {
      console.error('Backup encryption failed:', error);
      throw error;
    }
  }

  /**
   * Upload backup to cloud storage
   */
  async uploadToCloud(encryptedBackup, backupName) {
    try {
      const encryptedData = await fs.readFile(encryptedBackup.encryptedPath);
      const metadata = await fs.readFile(encryptedBackup.metadataPath, 'utf8');

      // Upload encrypted backup
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `backups/${backupName}.enc`,
        Body: encryptedData,
        ContentType: 'application/octet-stream'
      }));

      // Upload metadata
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `backups/${backupName}.meta`,
        Body: metadata,
        ContentType: 'application/json'
      }));

      console.log(`✅ Backup uploaded to cloud: ${backupName}`);
    } catch (error) {
      console.error('Cloud upload failed:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId, userId = null) {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      
      // Check if backup exists locally
      let backupExists = false;
      try {
        await fs.access(backupPath);
        backupExists = true;
      } catch {
        // Try to download from cloud
        if (process.env.ENABLE_CLOUD_BACKUP === 'true') {
          await this.downloadFromCloud(backupId);
          backupExists = true;
        }
      }

      if (!backupExists) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Read manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      // Verify checksum
      const currentChecksum = await this.generateChecksum(backupPath);
      if (currentChecksum !== manifest.checksum) {
        throw new Error('Backup integrity check failed');
      }

      // Restore database
      await this.restoreDatabase(manifest.database.path);

      // Restore files
      await this.restoreFiles(manifest.files.path);

      // Restore configuration
      await this.restoreConfiguration(manifest.configuration.path);

      // Log restoration
      if (userId) {
        await logActivity({
          user: userId,
          action: 'backup_restored',
          entityType: 'Backup',
          entityId: backupId,
          details: {
            type: manifest.type,
            timestamp: manifest.timestamp
          }
        });
      }

      console.log(`✅ Backup restored successfully: ${backupId}`);
      return {
        success: true,
        backupId,
        restoredAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Backup restoration failed:', error);
      throw error;
    }
  }

  /**
   * Restore database
   */
  async restoreDatabase(dbBackupPath) {
    try {
      const dbName = process.env.MONGODB_DATABASE || 'anchorfinance';
      
      // Drop existing database
      const dropCommand = `mongo ${dbName} --eval "db.dropDatabase()"`;
      await execAsync(dropCommand);

      // Restore from backup
      const restoreCommand = `mongorestore --db ${dbName} ${dbBackupPath}/${dbName}`;
      await execAsync(restoreCommand);

      console.log('✅ Database restored successfully');
    } catch (error) {
      console.error('Database restoration failed:', error);
      throw error;
    }
  }

  /**
   * Restore files
   */
  async restoreFiles(filesBackupPath) {
    try {
      // Restore uploads
      const uploadsBackup = path.join(filesBackupPath, 'uploads');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      try {
        await fs.access(uploadsBackup);
        await this.copyDirectory(uploadsBackup, uploadsDir);
      } catch {
        console.log('Uploads backup not found, skipping...');
      }

      // Restore logs
      const logsBackup = path.join(filesBackupPath, 'logs');
      const logsDir = path.join(process.cwd(), 'logs');
      
      try {
        await fs.access(logsBackup);
        await this.copyDirectory(logsBackup, logsDir);
      } catch {
        console.log('Logs backup not found, skipping...');
      }

      console.log('✅ Files restored successfully');
    } catch (error) {
      console.error('Files restoration failed:', error);
      throw error;
    }
  }

  /**
   * Restore configuration
   */
  async restoreConfiguration(configBackupPath) {
    try {
      // Restore system settings
      const settingsPath = path.join(configBackupPath, 'system-settings.json');
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);

      const SystemSettings = mongoose.model('SystemSettings');
      await SystemSettings.deleteMany({});
      await SystemSettings.insertMany(settings);

      console.log('✅ Configuration restored successfully');
    } catch (error) {
      console.error('Configuration restoration failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const backups = [];
      
      // List local backups
      const localBackups = await fs.readdir(this.backupDir);
      for (const backup of localBackups) {
        const backupPath = path.join(this.backupDir, backup);
        const stats = await fs.stat(backupPath);
        
        if (stats.isDirectory()) {
          try {
            const manifestPath = path.join(backupPath, 'manifest.json');
            const manifestData = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestData);
            
            backups.push({
              id: backup,
              type: manifest.type,
              timestamp: manifest.timestamp,
              size: await this.getDirectorySize(backupPath),
              location: 'local'
            });
          } catch {
            // Skip backups without manifest
          }
        }
      }

      // List cloud backups
      if (process.env.ENABLE_CLOUD_BACKUP === 'true') {
        try {
          const cloudBackups = await this.listCloudBackups();
          backups.push(...cloudBackups);
        } catch (error) {
          console.error('Failed to list cloud backups:', error);
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Get backup details
   */
  async getBackupDetails(backupId) {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      const manifestPath = path.join(backupPath, 'manifest.json');
      
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);
      
      return {
        ...manifest,
        size: await this.getDirectorySize(backupPath),
        location: 'local'
      };
    } catch (error) {
      console.error('Failed to get backup details:', error);
      throw error;
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId, userId = null) {
    try {
      const backupPath = path.join(this.backupDir, backupId);
      
      // Delete local backup
      await fs.rm(backupPath, { recursive: true, force: true });
      
      // Delete from cloud
      if (process.env.ENABLE_CLOUD_BACKUP === 'true') {
        await this.deleteFromCloud(backupId);
      }

      if (userId) {
        await logActivity({
          user: userId,
          action: 'backup_deleted',
          entityType: 'Backup',
          entityId: backupId
        });
      }

      console.log(`✅ Backup deleted: ${backupId}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Utility methods
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async getDirectorySize(dirPath) {
    let size = 0;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        size += await this.getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }

    return size;
  }

  async generateChecksum(directory) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    
    const processDirectory = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else {
          const content = await fs.readFile(fullPath);
          hash.update(content);
        }
      }
    };
    
    await processDirectory(directory);
    return hash.digest('hex');
  }

  async getChangesSinceLastBackup(lastBackupId) {
    // This is a simplified implementation
    // In a real scenario, you would track changes in the database
    return [];
  }

  async backupIncrementalData(changes, backupPath) {
    // This is a simplified implementation
    // In a real scenario, you would backup only the changed data
    return [];
  }

  async downloadFromCloud(backupId) {
    // Implementation for downloading from cloud storage
  }

  async listCloudBackups() {
    // Implementation for listing cloud backups
    return [];
  }

  async deleteFromCloud(backupId) {
    // Implementation for deleting from cloud storage
  }
}

export default new BackupService();
