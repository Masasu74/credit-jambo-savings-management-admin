import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadsDir, ensureFilePermissions } from '../config/uploadsConfig.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Use consistent uploads directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    const filename = uniqueName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|ico|pdf|docx|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) return cb(null, true);
  cb(new Error('Unsupported file type. Allowed: JPEG, JPG, PNG, ICO, PDF, DOCX, XLSX'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // ✅ 10MB limit for Render
    files: 1 // Allow only 1 file at a time
  }
});

// Enhanced upload middleware with permission fixing
export const uploadWithPermissions = (fieldName, maxCount = 1) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum allowed size is 10MB'
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      
      // Fix permissions for uploaded files
      if (req.files) {
        req.files.forEach(file => {
          const filePath = path.join(uploadsDir, file.filename);
          ensureFilePermissions(filePath);
        });
      }
      
      next();
    });
  };
};

export { upload };
