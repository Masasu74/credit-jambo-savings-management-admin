import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set uploads path - prioritize Render's persistent disk in production
const dataDir = process.env.NODE_ENV === 'production' && process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR) 
  : process.env.NODE_ENV === 'production'
  ? './uploads' // Render's persistent disk path (mounted at ./uploads)
  : path.resolve(__dirname, '.../uploads');

export const uploadsDir = dataDir;

// Ensure uploads directory exists with proper permissions
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    if (process.platform !== 'win32') {
      fs.chmodSync(uploadsDir, 0o755);
    }
    console.log(`Created uploads directory: ${uploadsDir}`);
  } catch (error) {
    console.error('Error creating uploads directory:', error);
    // Fallback to a directory we know we can write to
    const fallbackDir = process.env.NODE_ENV === 'production' 
      ? './uploads' // Use Render's persistent disk as fallback
      : path.resolve(__dirname, '.../uploads');
    
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    console.log(`Using fallback uploads directory: ${fallbackDir}`);
  }
}

// Fix permissions for existing files if needed
export const ensureFilePermissions = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    if ((stats.mode & 0o777) !== 0o644) {
      fs.chmodSync(filePath, 0o644);
    }
  } catch (error) {
    console.error('Error fixing file permissions:', error);
  }
};
